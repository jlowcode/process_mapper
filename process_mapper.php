<?php

defined('_JEXEC') or die('Restricted access');

use Fabrik\Helpers\Image;

require_once COM_FABRIK_FRONTEND . '/models/plugin-list.php';

class PlgFabrik_ListProcess_mapper extends PlgFabrik_List
{


    public function button(&$args)
    {
        parent::button($args);

        return true;
    }

    protected function getImageName()
    {
        return 'list';
    }

    protected function buttonLabel()
    {
        $params = $this->getParams();

        return $params->get('pmapper_button_label', 'Mapear Processo');
    }

    protected function getAclParam()
    {
        return 'pmapper_access';
    }

    public function onElementsToMapper()
    {
        $infos = $_POST['infos'];
        $processId = $_POST['processId'];
        $table = $_POST['table'];
        $elementBpmn = $_POST['elementBpmn'];

        $db = JFactory::getDbo();
        $query = $db->getQuery(true);
        $query->select($elementBpmn)->from($table)->where('id = ' . (int)$processId);
        $db->setQuery($query);
        $xml = $db->loadResult();

        $dom = new DOMDocument();
        $dom->loadXML($xml);
        $process = $dom->getElementsByTagName('process');
        $types = array('startEvent', 'sequenceFlow', 'endEvent');
        $els = array();
        $bpmn_ids = array();

        for ($j=0; $j<$process->length; $j++) {
            $elements = $process->item($j)->childNodes;
            $etapaAnterior = '';
            for ($i = 0; $i < $elements->length; $i++) {
                $element = $elements->item($i);
                if ($element->nodeType === 1) {
                    if (!in_array($element->localName, $types)) {
                        $el = new stdClass();
                        $el->titulo = $element->getAttribute('name');
                        $el->tipo = $element->localName;
                        $el->bpmn_id = $element->getAttribute('id');
                        $el->processo = $processId;
                        $el->xml = $dom->saveXML($element);
                        $el->delete = false;
                        $el->mapped = false;
                        $el->updated = true;
                        $el->notes = '';
                        $el->etapaAnterior = $etapaAnterior;
                        $etapaAnterior = $el->bpmn_id;

                        $query = $db->getQuery(true);
                        $query->select("id, {$infos['titulo']}, {$infos['tipo']}, {$infos['xml']}")->from($infos['table'])->where("{$infos['bpmn_id']} = '{$el->bpmn_id}' AND {$infos['processo']} = " . (int) $el->processo);
                        $db->setQuery($query);
                        $result = $db->loadAssoc();
                        if ($result) {
                            $el->mapped = true;
                            $el->id = $result['id'];

                            $elxml = crypt($el->xml,'rl');
                            $resultinfos = crypt($result[$infos['xml']],'rl');

                            if ($elxml != $resultinfos) {
                                $el->notes .= "Desatualizado<br>";
                                $el->updated = false;
                            }
                            if ($el->titulo !== $result['titulo']) {
                                $el->notes .= "- Elemento '{$infos['titulo']}' foi alterado no diagrama.<br>";
                                $el->updated = false;
                            }
                            if ($el->tipo !== $result['tipo']) {
                                $el->notes .= "- Elemento '{$infos['tipo']}' foi alterado no diagrama.<br>";
                                $el->updated = false;
                            }
                        }
                        
                        $gatways = array('complexGateway', 'eventBasedGateway', 'exclusiveGateway', 'parallelGateway', 'inclusiveGateway');
                        if (!in_array($el->tipo, $gatways)) { 
                            $els[] = $el;
                            $bpmn_ids[] = $el->bpmn_id;
                        }
                    }
                }
            }
        }
        $query = $db->getQuery(true);
        $query->select("id, {$infos['titulo']}, {$infos['tipo']}, {$infos['bpmn_id']}")->from($infos['table'])->where("{$infos['processo']} = " . (int) $processId);
        $db->setQuery($query);
        $result = $db->loadAssocList();


        foreach ($result as $item) {
            if ($item['tipo']  != ''  && $item['bpmn_id'] != ''){
                if (!in_array($item[$infos['bpmn_id']], $bpmn_ids)) {
                    $el = new stdClass();
                    $el->id = $item['id'];
                    $el->titulo = $item[$infos['titulo']];
                    $el->tipo = $item[$infos['tipo']];
                    $el->bpmn_id = $item[$infos['bpmn_id']];
                    $el->processo = $processId;
                    $el->delete_el = true;
                    $el->notes = '- O elemento não existe no diagrama.<br>';
                    $els[] = $el;
                }
            }
        }

        echo json_encode($els);
    }

    public function onCreateElement() {
        $row = $_POST['elementRow'];
        $infos = $_POST['infos'];

        $db = JFactory::getDbo();
        $insert = array();
        $insert['id'] = 0;
        $insert[$infos['titulo']] = $row['titulo'];
        $insert[$infos['bpmn_id']] = $row['bpmn_id'];
        $insert[$infos['processo']] = $row['processo'];
        $insert[$infos['tipo']] = $row['tipo'];
        $insert[$infos['xml']] = $row['xml'];

        if ($row['etapaAnterior'] !== '') {
            $query = $db->getQuery(true);
            $query->select('id')->from($infos['table'])->where("{$infos['bpmn_id']} = '{$row['etapaAnterior']}'");
            $db->setQuery($query);
            $etapaAnterior = $db->loadResult();
            if ($etapaAnterior) {
                $insert[$infos['etapaAnterior']] = $etapaAnterior;
            }
        }

        $insert = (Object) $insert;

        $db->insertObject($infos['table'], $insert, 'id');

        echo $db->insertid();
    }

    public function onDeleteElement() {
        $row = $_POST['elementRow'];
        $infos = $_POST['infos'];
        
        $db = JFactory::getDbo();
        $query = $db->getQuery(true);
        $query->delete($infos['table'])->where('id = ' . (int) $row['id']);
        $db->setQuery($query);
        $db->execute();
    }

    public function onUpdateProcessStatus() {
        $row = $_POST['elementRow'];
        $infos = $_POST['infos'];
      
        $db = JFactory::getDbo();
        $insert = array();
        $insert['id'] = $row['id'];
        $insert[$infos['titulo']] = $row['titulo'];
        $insert[$infos['bpmn_id']] = $row['bpmn_id'];
        $insert[$infos['processo']] = $row['processo'];
        $insert[$infos['tipo']] = $row['tipo'];
        $insert[$infos['xml']] = $row['xml'];

        if ($row['etapaAnterior'] !== '') {
            $query = $db->getQuery(true);
            $query->select('id')->from($infos['table'])->where("{$infos['bpmn_id']} = '{$row['etapaAnterior']}'");
            $db->setQuery($query);
            $etapaAnterior = $db->loadResult();
            if ($etapaAnterior) {
                $insert[$infos['etapaAnterior']] = $etapaAnterior;
            }
        }

        $insert = (Object) $insert;

        $update = $db->updateObject($infos['table'], $insert, 'id');

        echo $update;

        // $elementStatus = $_POST['elementStatus'];
        // $statusValue = $_POST['statusValue'];
        // $table = $_POST['table'];
        // $processId = $_POST['processId'];

        // $db = JFactory::getDbo();
        // $obj = new stdClass();
        // $obj->id = $processId;
        // $obj->$elementStatus = $statusValue;

        // $update = $db->updateObject($table, $obj, 'id');

        // echo $update;
    }

    protected function getInfos() {
        $params = $this->getParams();
        $info = new stdClass();

        $elementList = $params->get('pme_table');
        if ($elementList) {
            $db = JFactory::getDbo();
            $query = $db->getQuery(true);
            $query->select('db_table_name, form_id')->from("#__fabrik_lists")->where('id = ' . (int)$elementList);
            $db->setQuery($query);
            $result = $db->loadAssoc();
            $info->table = $result['db_table_name'];
            $info->form_id = $result['form_id'];

            if ($params->get('pme_titulo')) {
                $info->titulo = str_replace("{$info->table}___", '', $params->get('pme_titulo'));
            }
            if ($params->get('pme_bpmn_id')) {
                $info->bpmn_id = str_replace("{$info->table}___", '', $params->get('pme_bpmn_id'));
            }
            if ($params->get('pme_process')) {
                $info->processo = str_replace("{$info->table}___", '', $params->get('pme_process'));
            }
            if ($params->get('pme_tipo')) {
                $info->tipo = str_replace("{$info->table}___", '', $params->get('pme_tipo'));
            }
            if ($params->get('pme_etapa_anterior')) {
                $info->etapaAnterior = str_replace("{$info->table}___", '', $params->get('pme_etapa_anterior'));
            }
            if ($params->get('pme_bpmn_xml')) {
                $info->xml = str_replace("{$info->table}___", '', $params->get('pme_bpmn_xml'));
            }
        }

        return $info;
    }

    public function onLoadJavascriptInstance($args)
    {
        parent::onLoadJavascriptInstance($args);

        $listModel = $this->getModel();
        $worker = FabrikWorker::getPluginManager();
        $params = $this->getParams();

        $opts             = $this->getElementJSOptions();
        $opts->url = COM_FABRIK_LIVESITE;
        $opts->infos = $this->getInfos();
        $opts->table = $listModel->getTable()->db_table_name;
        $opts->elementBpmn = $worker->getElementPlugin($params->get('pmapper_bpmn'))->element->name;
        $opts->elementStatus = $worker->getElementPlugin($params->get('pmapper_status'))->element->name;
        $opts->statusValue = $params->get('pmapper_status_update');

        $opts             = json_encode($opts);
        $this->jsInstance = "new FbListProcess_mapper($opts)";

        return true;
    }

    public function loadJavascriptClassName_result()
    {
        return 'FbListProcess_mapper';
    }
}