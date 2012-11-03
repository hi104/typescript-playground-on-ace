define('autocomplete', ['require', 'exports', 'module', 'ace/keyboard/hash_handler'], function(require, exports, module) {

    var HashHandler = require('ace/keyboard/hash_handler').HashHandler;
    var EventEmitter = require("ace/lib/event_emitter").EventEmitter;
    var AutoCompleteView = require('AutoCompleteView').AutoCompleteView;

    var oop = require("ace/lib/oop");

    exports.AutoComplete = function(editor,script,  compilationService){

        var self = this;

        oop.implement(self, EventEmitter);
        this.handler = new HashHandler();
        this.view = new AutoCompleteView(editor, self);
        this.scriptName = script;
        this._active = false;
        this.inputText =''; //TODO imporve name

        this.isActive = function () {
            return self._active;
        };

        this.setScriptName = function (name){
            self.scriptName = name;
        };

        this.show = function () {
            self.listElement = self.view.listElement;
            editor.container.appendChild(self.view.wrap);
            self.listElement.innerHTML = '';
        };

        this.compilation = function(cursor){
            var compilationInfo = compilationService.getCursorCompilation(self.scriptName, cursor);
            var text  = compilationService.matchText;
            var coords = editor.renderer.textToScreenCoordinates(cursor.row, cursor.column - text.length);

            self.view.setPosition(coords);
            self.inputText = text;

            var compilations = compilationInfo.entries;

            if (self.inputText.length > 0){
                compilations = compilationInfo.entries.filter(function(elm){
                    return elm.name.toLowerCase().indexOf(self.inputText.toLowerCase()) == 0 ;
                });
            }

            var matchFunc = function(elm) {
                return elm.name.indexOf(self.inputText) == 0 ? 1 : 0;
            };

            var matchCompare = function(a, b){
                return matchFunc(b) - matchFunc(a);
            };

            var textCompare = function(a, b){
                 if (a.name == b.name){
                    return 0;
                 }else{
                     return (a.name > b.name) ? 1 : -1;
                 }
            };
            var compare = function(a, b){
                var ret = matchCompare(a, b);
                return (ret != 0) ? ret : textCompare(a, b);
            };

            compilations = compilations.sort(compare);

            self.showCompilation(compilations);

            return compilations.length;
        };

        this.refreshCompilation = function(e){
            var cursor = editor.getCursorPosition();
            if(e.data.action  == "insertText"){
                cursor.column += 1;
            } else if (e.data.action  == "removeText"){
                if(e.data.text == '\n'){
                    self.deactivate();
                    return;
                }
            }

            self.compilation(cursor);
        };

        this.showCompilation = function(infos){
            if (infos.length > 0){
                self.view.show();
                var html = '';
                // TODO use template
                for(var n in infos) {
                    var info = infos[n];
                    var name =  '<span class="label-name">' + info.name + '</span>';
                    var type =  '<span class="label-type">' + info.type + '</span>';
                    var kind =  '<span class="label-kind label-kind-'+ info.kind + '">' + info.kind.charAt(0) + '</span>';

                    html += '<li data-name="' + info.name + '">' + kind + name + type + '</li>';
                }
                self.listElement.innerHTML = html;
                self.view.ensureFocus();
            }else{
                self.view.hide();
            }
        };

        this.active = function () {
            self.show();
            var count = self.compilation(editor.getCursorPosition());
            if(!(count > 0)){
                self.hide();
                return;
            }
            editor.keyBinding.addKeyboardHandler(self.handler);
        };

        this.deactivate = function() {
            editor.keyBinding.removeKeyboardHandler(self.handler);
        };

        this.handler.attach = function(){
            editor.addEventListener("change", self.refreshCompilation);
            self._emit("attach", {sender: self});
            self._active = true;
        };

        this.handler.detach = function(){
            editor.removeEventListener("change", self.refreshCompilation);
            self.view.hide();
            self._emit("detach", {sender: self});
            self._active = false;
        };

        this.handler.handleKeyboard = function(data, hashId, key, keyCode) {
            if (hashId == -1) {

                if(" -=,[]_/()!';:<>".indexOf(key) != -1){ //TODO
                    self.deactivate();
                }
                return null;
            }

            var command = self.handler.findKeyCommand(hashId, key);

            if (!command){

                var defaultCommand = editor.commands.findKeyCommand(hashId, key);
                if(defaultCommand){
                    if(defaultCommand.name == "backspace"){
                        return null;
                    }
                    self.deactivate();
                }
                return null;
            }

            if (typeof command != "string") {
                var args = command.args;
                command = command.command;
            }

            if (typeof command == "string") {
                command = this.commands[command];
            }

            return {command: command, args: args};
        };


        exports.Keybinding = {
            "Up|Ctrl-p"      : "focusprev",
            "Down|Ctrl-n"    : "focusnext",
            "esc|Ctrl-g" : "cancel",
            "Return|Tab": "insertComplete"
        };

        this.handler.bindKeys(exports.Keybinding);

        this.handler.addCommands({
            focusnext:function(editor){
                self.view.focusNext();
            },
            focusprev:function(editor){
                self.view.focusPrev();
            },
            cancel:function(editor){
                self.deactivate();
            },
            insertComplete:function(editor){
                editor.removeEventListener("change", self.refreshCompilation);
                var curr = self.view.current();

                for(var i = 0; i<  self.inputText.length; i++){
                    editor.remove("left");
                }

                if(curr){
                    editor.insert($(curr).data("name"));
                }
                self.deactivate();

            }
        });
    };
});