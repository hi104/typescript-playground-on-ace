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
            text  = @editor.session.getLine(cursor.row).slice(0, cursor.column)

            isMemberCompletion = false
            matches = text.match(/\.([a-zA-Z_0-9\$]*$)/)

            if (matches && matches.length > 0)
                @matchText = matches[1]
                isMemberCompletion = true
                pos -= @matchText.length
            else
                matches = text.match(/[a-zA-Z_0-9\$]*$/)
                @matchText = matches[0]

            @getCompilation(script, pos, isMemberCompletion)

        getCurrentPositionCompilation:(script) =>
            @getCursorCompilation(script, @editor.getCursorPosition())

    exports.CompilationService = CompilationService
    exports
)