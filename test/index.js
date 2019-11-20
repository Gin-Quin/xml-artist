
const XML = require('..')
const { XmlNode } = XML
const path = require('path')
const inspect = require('util').inspect

const { start, stage, test } = require('fartest')

start(function() {
	stage("Open from a file")
	let root = XML.parseFile('test/file-sample.xml', {trim: false})

	stage("Produce xml")
	root.toXml()

	stage("Transform to and from JSON")
	let root2 = XML.parseJson(root.toJson())
	test(root.toXml() == root2.toXml())


	stage("Find some elements")
	let data = XML.parseFile('test/file-sample-B.xml', {trim: true})

	let heroes = data.find('heroes')
	let friends = heroes.findChild('friends')
	test(heroes, "Find heroes")

	test(heroes.findAll(['name=Zabu']).length == 2, "Find two zabus")
	test(heroes.findAllChildren(['name=Zabu']).length == 1, "Find one direct zabu child")
	test(heroes.findAll(['class=warrior']).length == 4, "Find four warriors")
	test(heroes.find('friends').findAll(['class=warrior']).length == 2, "Find two warrior friends")


	stage("Glob matching")
	test(data.findAll('h*').length == 7, "Find one element 'heroes' and six elements 'hero'")
	test(heroes.findAll(['name=*c*']).length == 4, "Find 4 heroes which have the 'c' character in their name")
	test(heroes.findAll(['*n*=*b*']).length == 2, "Find 2 heroes which have an attribute with name containing 'n' and value containing 'b'")


	stage("Moving elements")
	for (let node of heroes.findAll(['name=Zabu']))
		node.replaceWith("Disappeared Zabu ahahah")
	test(heroes.findAll(['name=Zabu']).length == 0, "No more Zabus")

	heroes.find(['name=Hercule']).pushTo(heroes.find('friends'))
	test(heroes.findChild(['name=Hercule']) == null, "Hercule is not a hero")
	test(heroes.find('friends').findAllChildren(['name=Hercule']).length = 2, "There are 2 Hercule friends now")

	stage("Find parents")
	var h = heroes.find(['name=Hercule'])
	test(h.findParent('friends'), "Hercule should have a friends parent")
	test(h.findParent('heroes'), "Hercule should have a heroes parent")
	test(h.findAllParents().length == 2, "Hercule has 2 parents")

	stage("Push array")
	var heroesToMove = heroes.findAllChildren('hero')
	var numberOfFriends = friends.children.length
	friends.push(heroesToMove)
	test(heroes.findAllChildren('hero').length == 0, "There shouldnt have any more heroes")
	test(friends.children.length == numberOfFriends + heroesToMove.length, "All should be friends now")

	stage("ReplaceWith array")
	var numberOfChildren = heroes.children.length - 1
	var numberOfCocos = friends.findAllChildren(['name=Coco']).length
	friends.replaceWith(friends.findAllChildren(['name=Coco']))
	test(heroes.find('friends') == null, "Friends should not exist")
	test(heroes.children.length == numberOfChildren + numberOfCocos, "There should be only Cocos left")
	test(heroes.findAllChildren(['name=Coco']).length == numberOfCocos, "Only Cocos!")
})

