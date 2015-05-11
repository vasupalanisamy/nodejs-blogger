let isLoggedIn = require('./middleware/isLoggedIn')
let then = require('express-then')
let multiparty = require('multiparty')
let Post = require('./models/post')
let User = require('./models/user')
let DataUri = require('datauri')
let fs = require('fs')
module.exports = (app) => {
let passport = app.passport

app.get('/', (req, res) => res.render('index.ejs'))

app.get('/login', (req, res) => res.render('login.ejs', {message: req.flash('error')}))

app.get('/signup', (req, res) => res.render('signup.ejs', {message: req.flash('error')}))

app.get('/profile', isLoggedIn, then(async(req, res) => {
	console.log("req.user" + req.user)
	let posts = await Post.promise.find({userid: req.user.id})
	console.log("posts" + posts)
	console.log("posts length" + posts.length)
	res.render('profile.ejs', {
		user: req.user,
		posts: posts,
		message: req.flash('error')
	})
}))
// process the login form
app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}))

app.post('/signup', passport.authenticate('local-signup', {
	successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
}))

app.get('/logout', (req, res) => {
	req.logout()
	res.redirect('/')
})

app.get('/post/:postid?', isLoggedIn, then(async(req, res) => {
	let postid = req.params.postid
	let post
	let verb
	let image
	if(!postid){
		console.log('i m in create', postid)
		verb = 'Create'
		post = {}
	} else {
		console.log('i m in update', postid)
		verb = 'Update'
		post = await Post.promise.findById(postid)
		let datauri = new DataUri()
		let imageDataUri = datauri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
		console.log(imageDataUri)
		image = `data:${post.image.contentType};base64,${imageDataUri.base64}`
		console.log(post)
		if(!post) {
			res.send('404', 'Not Found')
			return
		}
	}
	res.render('post.ejs', {
		post: post,
		verb: verb,
		image: image
	})
}))

app.post('/post/:postid?', isLoggedIn, then(async(req, res) => {
	let postid = req.params.postid
	let[{title: [title], content: [content]}, {image: [file]}] = await new multiparty.Form().promise.parse(req)
	let post
	if(!postid){
		console.log('creating.....', postid)
		post = new Post()
		post.userid = req.user.id
		post.createdDate = new Date()
		post.updatedDate = post.createdDate
	} else {
		console.log('updating.....', postid, file)
		post = await Post.promise.findById(postid)
		post.updatedDate = new Date()
		console.log('updating.....', post)
		if(!post) {
			res.send('404', 'Not Found')
			return
		}
	}
	console.log(title, content, post)
	post.title = title
	post.content = content
	if(file.originalFilename && file.originalFilename !== '') {
		console.log('updating the file...', file, file.path)
		post.image.data = await fs.promise.readFile(file.path)
		post.image.contentType = file.headers['content-type']
	}
	await post.save()
	res.redirect('/blog/' + encodeURI(req.user.blogTitle))
}))

app.get('/post/delete/:postid', isLoggedIn, then(async(req, res) => {
	let postId = req.params.postid
	await Post.promise.findByIdAndRemove(postId)
	res.redirect('/profile')
}))

app.get('/post/view/:postid', then(async(req, res) => {
	let postId = req.params.postid
	let post = await Post.promise.findById(postId)
	if(!post) {
		res.send('404', 'Not Found')
		return
	}
	let datauri = new DataUri()
	let imageDataUri = datauri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
	console.log(imageDataUri)
	let image = `data:${post.image.contentType};base64,${imageDataUri.base64}`
	res.render('viewpost.ejs', {
		post: post,
		image: image
	})
}))

app.get('/blog/:blogTitle', then(async(req, res) => {
	let blogTitle = decodeURI(req.params.blogTitle).toString()
	let user = await User.promise.findOne({blogTitle: blogTitle})
	console.log('post...' + user)
	let posts = await Post.promise.find({userid: user.id})
	res.render('blogs.ejs', {
		posts: posts,
		user: user
	})
}))

}
