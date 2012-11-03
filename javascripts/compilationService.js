(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('CompilationService', ['require', 'exports', 'module', 'EditorPosition'], function(require, exports, module) {
    var CompilationService, EditorPosition;
    EditorPosition = require('EditorPosition').EditorPosition;
    CompilationService = (function() {

      function CompilationService(editor, ServiceShim) {
        this.editor = editor;
        this.ServiceShim = ServiceShim;
        this.getCurrentPositionCompilation = __bind(this.getCurrentPositionCompilation, this);
        this.getCursorCompilation = __bind(this.getCursorCompilation, this);
        this.getCompilation = __bind(this.getCompilation, this);
        this.editorPos = new EditorPosition(this.editor);
      }

      CompilationService.prototype.getCompilation = function(script, charpos, isMemberCompletion) {
        var compInfo;
        compInfo = this.ServiceShim.languageService.getCompletionsAtPosition(script, charpos, isMemberCompletion);
        return compInfo;
      };

      CompilationService.prototype.getCursorCompilation = function(script, cursor) {
        var isMemberCompletion, matches, pos, range, text;
        pos = this.editorPos.getPositionChars(cursor);
        range = {
          start: {
            row: cursor.row,
            column: 0
          },
          end: {
            row: cursor.row,
            column: cursor.column
          }
        };
        text = editor.getSession().getTextRange(range);
        isMemberCompletion = false;
        matches = text.match(/\.([a-zA-Z_\-]*$)/);
        if (matches && matches.length > 0) {
          this.matchText = matches[1];
          isMemberCompletion = true;
          pos -= this.matchText.length;
        } else {
          matches = text.match(/[a-zA-Z_\-]*$/);
          this.matchText = matches[0];
        }
        return this.getCompilation(script, pos, isMemberCompletion);
      };

      CompilationService.prototype.getCurrentPositionCompilation = function(script) {
        return this.getCursorCompilation(script, this.editor.getCursorPosition());
      };

      return CompilationService;

    })();
    exports.CompilationService = CompilationService;
    return exports;
  });

}).call(this);
