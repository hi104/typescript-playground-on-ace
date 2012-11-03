(function() {

  define(function(require, exports, module) {
    var DocumentPositionUtil;
    DocumentPositionUtil = (function() {

      function DocumentPositionUtil() {}

      DocumentPositionUtil.getLinesChars = function(lines) {
        var count;
        count = 0;
        lines.forEach(function(line) {
          return count += line.length + 1;
        });
        return count;
      };

      DocumentPositionUtil.getChars = function(doc, pos) {
        return DocumentPositionUtil.getLinesChars(doc.getLines(0, pos.row - 1)) + pos.column;
      };

      DocumentPositionUtil.getPosition = function(doc, chars) {
        var count, i, line, lines, row;
        lines = doc.getAllLines();
        count = 0;
        row = 0;
        for (i in lines) {
          line = lines[i];
          if (chars < (count + (line.length + 1))) {
            return {
              row: row,
              column: chars - count
            };
          }
          count += line.length + 1;
          row += 1;
        }
        return {
          row: row,
          column: chars - count
        };
      };

      return DocumentPositionUtil;

    }).call(this);
    exports.DocumentPositionUtil = DocumentPositionUtil;
    return exports;
  });

}).call(this);
