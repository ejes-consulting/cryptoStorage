// cryptoStorage/index.js:  Multer Crypto Storage Module
const crypto=require('crypto'),
fs=require('fs'),
path=require('path'),
stream=require('stream'),
os=require('os'),
zlib=require('zlib');

const settings={
	algorithm:'aes-256-cbc', keylen:32, ivlen:16,
	salt:12,
	compress:zlib.createGzip,
	getDestination:(__req,__file,then)=>then(null,os.tmpdir()),
	randomFile:(dir)=>{
		let hash=crypto.createHash('sha256');
		hash.update(crypto.randomBytes(settings.salt));
		return path.format({dir:dir,name:hash.digest('hex')});
	}
};

function cryptoStorage(tmpdir) {
	this.getDestination=settings.getDestination;
	if(typeof tmpdir==='string'){
		this.getDestination=(__req,__file,then)=>then(null,tmpdir);
	}
	return this;
}

cryptoStorage.prototype._handleFile=function(req,file,then){
	this.getDestination(req,file,function(err,dir){
		if(err!=null){
			then(err);
			return;
		}

		let filename=settings.randomFile(dir),
			pipeline=[],
			key=crypto.randomBytes(settings.keylen),
			iv=crypto.randomBytes(settings.ivlen),
			cipherStream=crypto.createCipheriv(settings.algorithm,key,iv),
			outStream=fs.createWriteStream(filename),
			compress=(typeof settings.compress==='function')?settings.compress():false;


		if(settings.compress) {
			pipeline=[file.stream,compress,cipherStream,outStream];
		} else {
			pipeline=[file.stream,cipherStream,outStream];
		}

		stream.pipeline(pipeline,(err)=>{
			if(err!=null){
				then(err);
				return;
			}

			then(null,{
				algorithm:settings.algorithm,
				key:key.toString('base64'),
				iv:iv.toString('base64'),
				path:filename,
				size:outStream.bytesWritten
			});
		});
	});
}

cryptoStorage.prototype._removeFile=function(__req, file, cb){
	fs.unlink(file.path,cb);
};

module.exports=function(tmpdir,options){
	for(property in settings){
		if(typeof options[property]!=='undefined')
			settings[property]=options[property];
	}
	return new cryptoStorage(tmpdir);
};

// eof
