
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
	test(heroes, "Find heroes")

	test(heroes.findAll(['name=Zabu']).length == 2, "Find two zabus")
	test(heroes.findAllChild(['name=Zabu']).length == 1, "Find one direct zabu child")
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
	test(heroes.find('friends').findAllChild(['name=Hercule']).length = 2, "There are 2 Hercule friends now")
})

