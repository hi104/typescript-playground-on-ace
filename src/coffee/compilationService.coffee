define('CompilationService',  ['require', 'exports', 'module', 'EditorPosition'], (require, exports, module) ->

    EditorPosition = require('EditorPosition').EditorPosition

    class CompilationService
        constructor:(@editor, @ServiceShim) ->
            @editorPos = new EditorPosition(@editor)

        getCompilation:(script, charpos, isMemberCompletion) =>
            compInfo = @ServiceShim.languageService.getCompletionsAtPosition(script, charpos, isMemberCompletion);
            compInfo

        getCursorCompilation:(script, cursor) =>
            pos = @editorPos.getPositionChars(cursor)

            range ={
                start:{ row: cursor.row, column:0 },
                end:{ row: cursor.row, column:cursor.column }
            }

            text  = editor.getSession().getTextRange(range)

            isMemberCompletion = false
            matches = text.match(/\.([a-zA-Z_\-]*$)/)

            if (matches && matches.length > 0)
                @matchText = matches[1]
                isMemberCompletion = true
                pos -= @matchText.length
            else
                matches = text.match(/[a-zA-Z_\-]*$/)
                @matchText = matches[0]

            @getCompilation(script, pos, isMemberCompletion)

        getCurrentPositionCompilation:(script) =>
            @getCursorCompilation(script, @editor.getCursorPosition())

    exports.CompilationService = CompilationService
    exports
)