(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('EditorPosition', ['require', 'exports', 'module'], function(require, exports, module) {
    var DocumentPositionUtil, EditorPosition;
    DocumentPositionUtil = require('DocumentPositionUtil').DocumentPositionUtil;
    EditorPosition = (function() {

      function EditorPosition(editor) {
        this.editor = editor;
        this.getPositionLeftChar = __bind(this.getPositionLeftChar, this);
        this.getPositionChar = __bind(this.getPositionChar, this);
        this.getCurrentLeftChar = __bind(this.getCurrentLeftChar, this);
        this.getCurrentCharPosition = __bind(this.getCurrentCharPosition, this);
        this.getAcePositionFromChars = __bind(this.getAcePositionFromChars, this);
        this.getPositionChars = __bind(this.getPositionChars, this);
      }

      EditorPosition.prototype.getLinesChars = function(lines) {
        return DocumentPositionUtil.getLinesChars(lines);
      };

      EditorPosition.prototype.getPositionChars = function(pos) {
        var doc;
        doc = this.editor.getSession().getDocument();
        return DocumentPositionUtil.getChars(doc, pos);
      };

      EditorPosition.prototype.getAcePositionFromChars = function(chars) {
        var doc;
        doc = this.editor.getSession().getDocument();
        return DocumentPositionUtil.getPosition(doc, chars);
      };

      EditorPosition.prototype.getCurrentCharPosition = function() {
        return this.getPositionChars(this.editor.getCursorPosition());
      };

      EditorPosition.prototype.getCurrentLeftChar = function() {
        return this.getPositionLeftChar(this.editor.getCursorPosition());
      };

      EditorPosition.prototype.getPositionChar = function(cursor) {
        var range;
        range = {
          start: {
            row: cursor.row,
            column: cursor.column
          },
          end: {
            row: cursor.row,
            column: cursor.column + 1
          }
        };
        return this.editor.getSession().getDocument().getTextRange(range);
      };

      EditorPosition.prototype.getPositionLeftChar = function(cursor) {
        var range;
        range = {
          start: {
            row: cursor.row,
            column: cursor.column
          },
          end: {
            row: cursor.row,
            column: cursor.column - 1
          }
        };
        return this.editor.getSession().getDocument().getTextRange(range);
      };

      return EditorPosition;

    })();
    exports.EditorPosition = EditorPosition;
    return exports;
  });

}).call(this);
