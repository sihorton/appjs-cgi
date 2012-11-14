/*
* @TODO: do a stat of the script, if a directory use directoryIndex. 
*/
/**
app.router.use(require('appjs-cgi').router({
	env:{
		//these should not be removed, but customise and add any parameters you want. 
		'SERVER_SOFTWARE':"AppJS"
		,'SERVER_PROTOCOL':"HTTP/1.1"
		,'GATEWAY_INTERFACE':"CGI/1.1"
		,'SERVER_NAME':"appjs.org"
		,'SERVER_PORT':80
		,'DOCUMENT_ROOT':__dirname+'/content/'
	},directoryIndex:'index.php'         //if you navigate to a directory this file will be tried.
	,ext:'.php'                          //if request matches extension then cgi router will be triggered
	,bin:'___path_to_cgi_exe__'          //path to cgi executable
	,debug:true                          //if true outputs request & cgi call to console.
	,sterr:function(err){}               //function to handle any errors from cgi script, e.g. write to a server log.
	,envFn:function(env) {               //triggered for each request before script execution.
		//view env vars for this request and modify them... 
		return env;
	}
}));
**/
var spawn = require('child_process').spawn
	path  = require('path')
;

function router(params) {
	//create cgi environment variables.
	var reqEnv = {};
	for(var keys = Object.keys(process.env), l = keys.length; l; --l) {
	   reqEnv[ keys[l-1] ] = process.env[ keys[l-1] ];
	}
	for(var keys = Object.keys(params.env), l = keys.length; l; --l)	{
	   reqEnv[ keys[l-1] ] = params.env[ keys[l-1] ];
	}
				
	var cgiRouter = function router(request, response, next){
		var url = request.pathname;
		if (request.pathname == '/') {
			url = params.directoryIndex;
		}
		if (path.extname(url) == params.ext) {
			var exec = require('child_process').exec;
			var p = path.resolve(reqEnv['DOCUMENT_ROOT']+url);
			
			//set environment variables for this request
			reqEnv['SCRIPT_NAME'] = url;
			reqEnv['PATH_INFO'] = '';//not supported a the moment.
			reqEnv['PATH_TRANSLATED'] = reqEnv['DOCUMENT_ROOT']+url;
			reqEnv['QUERY_STRING'] = req.uri.query || '';
			reqEnv['REQUEST_METHOD'] = request.method;
			
			//add request headers, "User-Agent" -> "HTTP_USER_AGENT"
			for (var header in request.headers) {
				reqEnv['HTTP_' + header.toUpperCase().split("-").join("_")] = request.headers[header];
			}
			//copy in additional special headers..
			if ('content-length' in request.headers) {
				reqEnv['CONTENT_LENGTH'] = request.headers['content-length'];
			}
			if ('content-type' in request.headers) {
				reqEnv['CONTENT_TYPE'] = request.headers['content-type'];
			}
			if ('authorization' in request.headers) {
				reqEnv['AUTH_TYPE'] = request.headers.authorization.split(' ')[0];
			}
			//user defined fn can alter the env for each request
			if (params.envFn) reqEnv = params.envFn(reqEnv);
						
			var cmd = params.bin+' "'+p+'"';
			if (params.debug) {
				console.log("request:"+url);
				console.log("running:"+cmd);
			}
			//we could merge params.env with process.env
			var cgi = spawn(params.bin, [], {
			  'env': params.env
			});
			//request body is just sent directly to stdin of CGI for it to handle.
			request.pipe(cgi.stdin);
			var headersSent = false;
			cgi.stout.on('data',function(data) {
				if (headersSent) {
					//stream data to browser as soon as it is available.
					response.write(data);
				} else {
					var lines = data.toString().split("\n");
					//set headers until you get a blank line...
					for(var l=0;l<lines.length;l++) {
						if (lines[l] == "") {
							response.writeHead(200);
							headersSent = true;
							//send rest asap
							response.write(lines.slice(l+1).join('\n'));
						} else {
							//set header
							var header = lines[l].split(":");
							response.setHeader(header[0], header[1]||'');
						}
					}
				}
			});
			cgi.stout.on('end',function() {
				response.end();
			});
			if (params.sterr) {
				cgi.sterr.on('data',params.sterr);
			}
		} else {
			next();
		}
	}
	return cgiRouter;
}
module.exports.router = router;