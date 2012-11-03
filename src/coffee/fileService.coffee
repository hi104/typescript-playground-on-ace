define('FileService',  ['require', 'exports', 'module' ], (require, exports, module) ->
    class FileService
        constructor:(@ajaxHost) ->

        readFile:(path, cb) =>
            @ajaxHost.ajax({
                type: "GET",
                url: path,
                success: cb
                error :((jqXHR, textStatus) =>
                    console.log(textStatus)
                )}
            )

        writeFile:(path, content, cb) =>
            @ajaxHost.ajax({
                type: "POST",
                url: path,
                data: { content:content}
                success: cb
                error :((jqXHR, textStatus) =>
                    console.log(textStatus)
                )}
            )

    exports.FileService = FileService
    exports
)