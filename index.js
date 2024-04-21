// cryptoStorage/index.js:  Multer Crypto Storage Module
const crypto=require('crypto'),
fs=require('fs'),
path=require('path'),
stream=require('stream'),
os=require('os'),
zlib=require('zlib');

const options={
	algorithm:'aes-256-cbc', keylen:32, ivlen:16,
	salt:12,
	compress:zlib.createGzip,
	getDestination:(__req,__file,then)=>then(null,os.tmpdir()),
	randomFile:()=>{
		let hash=crypto.createHash('sha256');
		hash.update(crypto.randomBytes(options.salt));
		return hash.digest('hex');
	}
};

function cryptoStorage(tmpdir) {
	this.getDestination=options.getDestination;
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

		let filename=path.format({dir:dir,name:options.randomFile()}),
			pipeline=[],
			key=crypto.randomBytes(options.keylen),
			iv=crypto.randomBytes(options.ivlen),
			cipherStream=crypto.createCipheriv(options.algorithm,key,iv),
			outStream=fs.createWriteStream(filename),
			compress=options.compress();


		if(typeof options.compress==='function') {
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
				algorithm:options.algorithm,
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
	options=options;
	return new cryptoStorage(tmpdir);
};

// eof
