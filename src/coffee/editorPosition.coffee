define('EditorPosition',  ['require', 'exports', 'module'], (require, exports, module) ->

    DocumentPositionUtil = require('DocumentPositionUtil').DocumentPositionUtil

    class EditorPosition
        constructor:(@editor) ->

        getLinesChars:(lines) ->
            DocumentPositionUtil.getLinesChars(lines)

        getPositionChars:(pos) =>
            doc = @editor.getSession().getDocument()
            DocumentPositionUtil.getChars(doc, pos)

        getAcePositionFromChars:(chars) =>
            doc = @editor.getSession().getDocument()
            DocumentPositionUtil.getPosition(doc, chars)

        getCurrentCharPosition:() =>
            @getPositionChars(@editor.getCursorPosition())

        getCurrentLeftChar:() =>
            @getPositionLeftChar(@editor.getCursorPosition())

        getPositionChar:(cursor)=>
            range = {
                start:{ row: cursor.row, column:cursor.column },
                end:{ row: cursor.row, column:cursor.column + 1 }
            }
            @editor.getSession().getDocument().getTextRange(range)

        getPositionLeftChar:(cursor) =>
            range = {
                start:{ row: cursor.row, column:cursor.column },
                end:{ row: cursor.row, column:cursor.column - 1 }
            }
            @editor.getSession().getDocument().getTextRange(range)

    exports.EditorPosition = EditorPosition
    exports
)