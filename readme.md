Router for AppJS that can spawn cgi scripts.

Installation
=====

    cd data/
    npm install appjs-cgi

Quick Start
========

    var app = require("appjs");
    app.router.use(require('appjs-cgi').router({
	/* cgi environment variables, passed to cgi, add and customise as you want. */
	env:{
		'SERVER_SOFTWARE':"AppJS/0.20"
		,'SERVER_PROTOCOL':"HTTP/1.1"
		,'GATEWAY_INTERFACE':"CGI/1.1"
		,'SERVER_NAME':"appjs"
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

The router calls "next();" if the file extension is not matched in the request, so you can make multiple calls to
app.router.use and setup one cgi router to handle .php scripts and another for python, perl or anything else.

Motivation:
=========
AppJS gives a great environment for developing desktop applications using modern javascript / html / css3 environment.
However if you are not used to nodejs programming it can be a bit challenging when you first start. This module
lets you use server scripting skills to plug that gap until you learn nodejs enough to do it all in nodejs!



