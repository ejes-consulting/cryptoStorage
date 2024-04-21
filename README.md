# Multer cryptoStorage Storage Engine

This crypto stroage engine is a class that provides a crypto-backed backend
for the Multer (multer middleware)

## Installation
Simply run npm

```
$ npm install --save cryptoStorage
```

## Usage
Multer adds a `body` object and a `file` or `files` object to the `request` object. The `body` object contains the values of the text fields of the form, the `file` or `files` object contains the files uploaded via the form.

cryptoStorage adds to this `body.file` or `body.files` object and encrypts the incoming file using the provided algorithm.  The values added are `algorithm`, `key`, and `iv`.

```javascript
const crypto = require('crypto');
const multer = require('multer');
const cryptoStorage=require('cryptoStorage');
const upload = multer({storage:cryptoStorage(__dirname)}).single('private');

app.post('/save', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
    } else if (err) {
      // An unknown error occurred when uploading.
    }
    // Everything went fine.

	// req.file=[{
	// 		fieldname:'private',
	// 		originalname:'original filename.txt', 
	// 		encoding:'binary',
	//		mimetype:'text/plain',
	//		size:1024,
	//		path:'randomfilename',
	// 		algorithm:'aes-256-cbc',
	//		key:'base64key',
	// 		iv:'base64iv'
	// }];
	// you can decrypt this with:
	// crypto.createDecipheriv(files[0].algorithm,files[0].key,files[0].iv);


  })
})

```

## API

### File information

Each file contains the following information:

Key | Description | Note
--- | --- | ---
`fieldname` | Field name specified in the form |
`originalname` | Name of the file on the user's computer |
`encoding` | Encoding type of the file |
`mimetype` | Mime type of the file |
`size` | Size of the file in bytes |
`path` | A randomly generated filename |
`algorithm` | The files encrypted algorithm |
`key` | The files key, in base64 format |
`iv` | The files iv, in base64 format |

### `cryptoStorage(__dirname,options)`

cryptoStorage accepts an `options` object, in most cases you will not need to modify this object, it is provided for advanced use cases.

Note: By default, cryptoStorage will use the "aes-256-cbc" cipher, with a 32 byte key length, and a 16 byte IV length.

Key | Description | Note
--- | --- | ---
`algorithm` | This is the cipher used, defaults to aes-256-cbc |
`salt` | This is the number of bytes that are, by default, used as a salt to generate a random filename |
`compress` | A compression stream.  defaults to zlib.createGzip |
`getDestination` | A function returning a new, temporary directory.  defaults to cb(null,os.tmpdir()) |
`randomFile` | A function returning a random string suitable for a filename.  defaults to a hex representation of random bytes |

In an average app, only a directory name  might be required, and configured as shown in the following example.

```javascript
const upload = multer({storage:cryptoStorage(__dirname)});
```
