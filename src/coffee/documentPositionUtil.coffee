define('DocumentPositionUtil',  ['require', 'exports', 'module'], (require, exports, module) ->
    class DocumentPositionUtil

        @getLinesChars:(lines)->
            count = 0
            lines.forEach((line) =>
                count += (line.length + 1)
            )
            count

        @getChars:(doc, pos) ->
            @getLinesChars(doc.getLines(0, pos.row - 1)) + pos.column

        @getPosition:(doc, chars) ->
            lines = doc.getAllLines()
            count = 0
            row = 0
            for i,line of lines
                if(chars < (count  + (line.length + 1)))
                   return {row: row, column: (chars - count)}
                count += (line.length + 1)
                row += 1

            {row: row, column: (chars - count)}

    exports.DocumentPositionUtil = DocumentPositionUtil
    exports
)