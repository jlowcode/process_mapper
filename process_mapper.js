define (["jquery", "fab/list-plugin"], function (jQuery, FbListPlugin) {
    var FbListProcess_mapper = new Class ({
        Extends:FbListPlugin,
        initialize: function (options) {
            this.parent(options);
        },
        buttonAction: function () {
            var id_selected = [], input_clicked, xml_bpmn, body;
            this.listform.getElements('input[name^=ids]').each(function (id) {
                if (id.get('value') !== false && id.checked !== false) {
                    id_selected.push(id.get('value'));
                }
            });

            if (id_selected.length === 1) {
                if (jQuery("#processMapperModal").length) {
                    jQuery("#processMapperModal").remove();
                }

                this.setProcessElements(id_selected[0]);
            }
        },
        createModal: function() {
            var modal = document.createElement('div');
            modal.setAttribute('class', 'process_mapper-modal');
            modal.setAttribute('id', 'processMapperModal');

            var modalContent = document.createElement('div');
            modalContent.setAttribute('class', 'process_mapper-modal-content');

            var modalHeader = document.createElement('div');
            modalHeader.setAttribute('class', 'process_mapper-modal-header');
            var buttonClose = document.createElement('span');
            buttonClose.setAttribute('class', 'process_mapper-modal-close');
            buttonClose.innerHTML = '&times;';
            var title = document.createElement('h4');
            title.innerHTML = 'Mapeamento';
            modalHeader.appendChild(buttonClose);
            modalHeader.appendChild(title);

            var modalBody = document.createElement('div');
            modalBody.setAttribute('class', 'process_mapper-modal-body');

            var table_mapper = document.createElement('div');
            table_mapper.setAttribute('id', 'div_table_mapper');
            table_mapper.setAttribute('class', 'table-responsive');
            table_mapper.setAttribute('style', 'overflow: auto');

            modalBody.appendChild(table_mapper);

            /*var frameBPMN = document.createElement('iframe');
            frameBPMN.setAttribute('src', Fabrik.liveSite + 'plugins/fabrik_list/process_modeler/modeler/public/index.html');
            frameBPMN.setAttribute('style', 'width: 100%; height: 1500px');
            modalBody.appendChild(frameBPMN);*/

            var modalFooter = document.createElement('div');
            modalFooter.setAttribute('class', 'process_mapper-modal-footer');

            var validateButton = document.createElement('button');
            validateButton.setAttribute('class', 'btn btn-default');
            validateButton.setAttribute('id', 'validateButton');
            validateButton.setAttribute('style', 'margin: 5px')
            validateButton.innerHTML = "Validar";

            var mapearTudoButton = document.createElement('button');
            mapearTudoButton.setAttribute('class', 'btn btn-default');
            mapearTudoButton.setAttribute('id', 'mapearTudo');
            mapearTudoButton.setAttribute('style', 'margin: 5px');
            mapearTudoButton.innerHTML = "Mapear Tudo";

            modalFooter.appendChild(validateButton);
            modalFooter.appendChild(mapearTudoButton);

            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            modal.appendChild(modalContent);

            var body = document.getElement("body");
            var head = document.getElement('head');
            var linkCss = document.createElement('link');
            linkCss.setAttribute('href', this.options.url + 'plugins/fabrik_list/process_mapper/modal/modal.css');
            linkCss.setAttribute('rel', 'stylesheet');

            body.appendChild(modal);
            head.appendChild(linkCss);
        },
        openModal: function () {
            var modal = document.getElementById("processMapperModal");
            var body = document.getElement("body");

            body.style.overflowY = "hidden";
            modal.style.display = "block";

            var span = document.getElementsByClassName("process_mapper-modal-close")[0];

            span.onclick = function() {
                modal.style.display = "none";
                body.style.overflowY = "auto";
            };

            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                    body.style.overflowY = "auto";
                }
            };
        },
        setProcessElements: function (processId) {
            var self = this;
            self.options.processId = processId;

            jQuery.ajax ({
                url: Fabrik.liveSite + 'index.php',
                method: "POST",
                data: {
                    'option': 'com_fabrik',
                    'format': 'raw',
                    'task': 'plugin.pluginAjax',
                    'plugin': 'process_mapper',
                    'method': 'elementsToMapper',
                    'g': 'list',
                    'processId': processId,
                    'table': self.options.table,
                    'elementBpmn': self.options.elementBpmn,
                    'infos': self.options.infos
                }
            }).done (function (data) {
                self.options.processElements = JSON.parse(data);

                self.createModal();
                self.createTable();
                self.validateButton();
                self.mapearTudo();
                self.openModal();
            });
        },
        createTable: function () {
            var div = document.getElementById('div_table_mapper');
            var table = document.createElement('table');
            table.setAttribute('class', 'table');
            table.setAttribute('id', 'table_mapper')
            var thead = document.createElement('thead');
            var tr_head = document.createElement('tr');
            var first_th = document.createElement('th');
            first_th.setAttribute('scope', 'col');
            first_th.innerHTML = 'Elemento do Diagrama';
            var second_th = document.createElement('th');
            second_th.setAttribute('scope', 'col');
            second_th.innerHTML = 'Tipo';
            var third_th = document.createElement('th');
            third_th.setAttribute('scope', 'col');
            third_th.innerHTML = 'Estado';
            var fourth_th = document.createElement('th');
            fourth_th.setAttribute('scope', 'col');
            fourth_th.innerHTML = 'Observações';

            tr_head.appendChild(first_th);
            tr_head.appendChild(second_th);
            tr_head.appendChild(third_th);
            tr_head.appendChild(fourth_th);
            thead.appendChild(tr_head);
            table.appendChild(thead);

            var tbody = document.createElement('tbody');
            var i, tr, td1, td2, td3, td4, a_link;
            var rows = this.options.processElements;
            var self = this;
            for (i=0; i<rows.length; i++) {
                tr = document.createElement('tr');
                td1 = document.createElement('td');
                td1.innerHTML = rows[i].titulo;
                td2 = document.createElement('td');
                td2.innerHTML = rows[i].tipo;
                td3 = document.createElement('td');
                a_link = document.createElement('a');
                if (rows[i].delete_el) {
                    a_link.setAttribute('href', '#');
                    a_link.setAttribute('id', i);
                    a_link.innerHTML = "Excluir";
                    a_link.onclick = function () {
                        jQuery.ajax ({
                            url: Fabrik.liveSite + 'index.php',
                            method: "POST",
                            data: {
                                'option': 'com_fabrik',
                                'format': 'raw',
                                'task': 'plugin.pluginAjax',
                                'plugin': 'process_mapper',
                                'method': 'deleteElement',
                                'g': 'list',
                                'elementRow': self.options.processElements[this.getAttribute('id')],
                                'infos': self.options.infos
                            }
                        }).done ((data) => {
                            var parent_td = this.getParent();
                            var parent_row = parent_td.getParent();
                            parent_row.remove();
                        });
                    }
                }
                else if (rows[i].updated == false){
                    a_link.setAttribute('href', '#');
                    a_link.setAttribute('id', i);
                    a_link.innerHTML = 'Atualizar';
                    a_link.onclick = function() {
                        jQuery.ajax ({
                            url: Fabrik.liveSite + 'index.php',
                            method: "POST",
                            data: {
                                'option': 'com_fabrik',
                                'format': 'raw',
                                'task': 'plugin.pluginAjax',
                                'plugin': 'process_mapper',
                                'method': 'updateProcessStatus',
                                'g': 'list',
                                'elementRow': self.options.processElements[this.getAttribute('id')],
                                'infos': self.options.infos
                            }
                        }).done ((data) => {
                            this.setAttribute('href', "#");
                            this.setAttribute('formvalue', self.options.infos.form_id);
                            this.innerHTML = "Atualizado";
                            self.options.processElements[this.getAttribute('id')].mapped = true;
                            self.options.processElements[this.getAttribute('id')].notes = "";
                        });
                    }
                }
                else if (rows[i].mapped) {
                    a_link.setAttribute('href', "javascript:window.open('" + Fabrik.liveSite + "index.php?option=com_fabrik&view=form&formid=" + this.options.infos.form_id + "&rowid=" + rows[i].id + "','_blank')");
                    a_link.setAttribute('target', '');
                    a_link.setAttribute('formvalue', this.options.infos.form_id);
                    a_link.innerHTML = 'Mapeado';
                    // a_link.innerHTML = 'Atualizar';
                } else if (rows[i].tipo == 'textAnnotation' || rows[i].tipo == 'association' || rows[i].tipo == 'laneSet'){     
                    a_link.innerHTML = 'Ignorar';
                }
                else {
                    a_link.setAttribute('href', '#');
                    a_link.setAttribute('id', i);
                    a_link.innerHTML = 'Mapear';
                    a_link.onclick = function() {
                        jQuery.ajax ({
                            url: Fabrik.liveSite + 'index.php',
                            method: "POST",
                            data: {
                                'option': 'com_fabrik',
                                'format': 'raw',
                                'task': 'plugin.pluginAjax',
                                'plugin': 'process_mapper',
                                'method': 'createElement',
                                'g': 'list',
                                'elementRow': self.options.processElements[this.getAttribute('id')],
                                'infos': self.options.infos
                            }
                        }).done ((data) => {
                            //this.setAttribute('href', "javascript:window.open('" + Fabrik.liveSite + "index.php?option=com_fabrik&view=form&formid=" + self.options.infos.form_id + "&rowid=" + data + "','_blank')");
                            //this.setAttribute('target', '');
                            //this.setAttribute('formvalue', self.options.infos.form_id);
                            this.innerHTML = "Mapeado";
                            // this.innerHTML = "Atualizar";
                            //this.onclick = function () {};
                            self.options.processElements[this.getAttribute('id')].mapped = true;
                        });
                    }
                }
                td3.appendChild(a_link);
                td4 = document.createElement('td');
                td4.innerHTML = rows[i].notes;

                tr.appendChild(td1);
                tr.appendChild(td2);
                tr.appendChild(td3);
                tr.appendChild(td4);
                tbody.appendChild(tr);
            }

            table.appendChild(tbody);
            div.appendChild(table);
        },
        validateButton: function () {
            var button = document.getElementById('validateButton');

            var self = this;
            button.onclick = function () {
                if (self.options.processElements.length > 0) {
                    var i;
                    var rows = self.options.processElements;
                    var mapped = true;
                    var userTask = false;
                    for (i=0; i<rows.length; i++) {
                        if (rows[i].mapped === false) {
                            mapped = false;   
                        }
                        if (rows[i].tipo === 'userTask') {
                            userTask = true;
                        }
                    }
                    if (!mapped) {
                        alert("Faltam elementos para mapear!");
                    }
                    else if (!userTask) {
                        alert("Necessário pelo menos uma tarefa de usuário!");
                    }
                    else {
                        jQuery.ajax ({
                            url: Fabrik.liveSite + 'index.php',
                            method: "POST",
                            data: {
                                'option': 'com_fabrik',
                                'format': 'raw',
                                'task': 'plugin.pluginAjax',
                                'plugin': 'process_mapper',
                                'method': 'updateProcessStatus',
                                'g': 'list',
                                'processId': self.options.processId,
                                'table': self.options.table,
                                'elementStatus': self.options.elementStatus,
                                'statusValue': self.options.statusValue
                            }
                        }).done (function (data) {
                            alert("Status do processo atualizado!");
                        });
                    }
                }
                else {
                    alert("Não existem elementos no diagrama BPMN!!");
                }
            }
        },
        mapearTudo: function () {
            var rows = this.options.processElements;
            var button = document.getElementById('mapearTudo');

            button.onclick = function () {
                var i, a;
                for (i=0; i<rows.length; i++) {
                    a = document.getElementById(i);
                    if (a) {
                        if (a.innerHTML === 'Mapear') {
                            a.click();
                        }
                    }
                }
            }
        }
    });

    return FbListProcess_mapper;
});