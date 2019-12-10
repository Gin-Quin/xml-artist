'use strict';

const sax = require('sax')

function XML() {
	let result = ''
	for (let arg of arguments)
		result += typeof arg == 'string'? arg : arg[0]
	return XML.parse(result)
}

/**
* Create a root XmlNode from some xml string
*/
XML.parse = function(xml, options) {
	if (Buffer.isBuffer(xml))
		xml = xml.toString()
	return (new XmlNode).parse(xml, options)
}

/**
* Same but from a JSON string
*/
XML.parseJson = function(json) {
	return new XmlNode(JSON.parse(json))
}

/**
* Same but from a file
*/
XML.parseFile = function(filename, options) {
	const { readFileSync } = require('fs')
	let fileContent = readFileSync(filename, (options && options.encoding) || 'utf8')
	return (new XmlNode).parse(fileContent, options)
}


/**
* Main class
*/
class XmlNode {
	constructor(node) {
		const { name, attributes, children, processingInstructions } = node || {}
		this.name = name || ''
		this.attributes = attributes || {}
		this.children = []
		if (children) for (const child of children)
			this.push(typeof child == 'object' ? new XmlNode(child) : child)
		if (processingInstructions)
			this.processingInstructions = [ ...processingInstructions ]
	}

	find(name, attributes) {
		return this.walk(matcher(name, attributes)) || null
	}

	findAll(name, attributes) {
		const match = matcher(name, attributes)
		const result = []
		this.walk(node => { if (match(node)) result.push(node) })
		return result
	}

	findChild(name, attributes) {
		return this.children.find(matcher(name, attributes)) || null
	}

	findAllChildren(name, attributes) {
		return this.children.filter(matcher(name, attributes))
	}

	findParent(name, attributes) {
		const match = matcher(name, attributes)
		let parent = this
		while ((parent = parent.parent) && parent.name)
			if (match(parent))
				return parent
		return null
	}

	findAllParents(name, attributes) {
		const match = matcher(name, attributes)
		const matches = []
		let parent = this
		while ((parent = parent.parent) && parent.name)
			if (match(parent))
				matches.push(parent)
		return matches
	}

	match(name, attributes) {
		return matcher(name, attributes)(this) == this
	}

	clone() {
		return new XmlNode(this)
	}

	walk(nodeCallback, textCallback=null) {
		let result

		for (let child of this.children) {

			if (child instanceof XmlNode) {
				if (nodeCallback)
					result = nodeCallback(child)
				if (result) return result
				result = child.walk(nodeCallback, textCallback)
			}
			else if (textCallback)
				result = textCallback(child, this)
			
			if (result) return result
		}
	}

	replaceWith(xmlNode) {
		const {parent} = this
		if (!parent) return this
		const {children} = parent
		const indexOfThis = children.indexOf(this)

		if (Array.isArray(xmlNode)) {
			xmlNode
			.filter(node => node instanceof XmlNode)
			.forEach(node => { node.remove() ; node.parent = parent })
			children.splice(indexOfThis, 1, ...xmlNode)
		}
		else if (xmlNode instanceof XmlNode) {
			xmlNode.remove()
			xmlNode.parent = parent
			children[indexOfThis] = xmlNode
		}
		else
			children[indexOfThis] = xmlNode

		delete this.parent
		return this
	}

	remove() {
		if (this.parent) {
			const {children} = this.parent
			children.splice(children.indexOf(this), 1)
			delete this.parent
		}
		return this
	}

	removeChild() {
		const {children} = this
		for (const child of arguments) {
			const index = children.indexOf(child)
			if (index != -1) {
				children.splice(index, 1)
				if (child instanceof XmlNode)
					delete child.parent
			}
		}
		return this
	}

	pushTo(parentNode, before) {
		parentNode.push(this, before)
		return this
	}

	push(xmlNode, before=-1) {
		if (typeof before == 'object')
			before = before ? -1 : this.children.indexOf(before)

		// array
		if (Array.isArray(xmlNode)) {
			xmlNode
			.filter(node => node instanceof XmlNode)
			.forEach(node => { node.remove() ; node.parent = this })
			if (before == -1)
				this.children.push(...xmlNode)
			else
				this.children.splice(before, 0, ...xmlNode)
			return this
		}

		// XmlNode or string
		if (xmlNode instanceof XmlNode) {
			xmlNode.remove()
			xmlNode.parent = this
		}
		if (before == -1)
			this.children.push(xmlNode)
		else
			this.children.splice(before, 0, xmlNode)

		return this
	}

	empty() {
		for (let child of this.children)
			if (child instanceof XmlNode)
				delete child.parent
		this.children = []
		return this
	}


	parse(xml, options) {
		this.empty()
		let currentNode = this
		let cdata = ''

		options = Object.assign({
			strict: true,
			trim: false,
			normalize: false,
			lowercase: true,
			xmlns: false,
			position: false,
			strictEntities: false,
		}, options)

		const parser = sax.parser(options.strict, options)

		Object.assign(parser, {
			ontext(text) { currentNode.children.push(text) },
			oncomment(text) { currentNode.children.push(text) },
			ondoctype(doctype) { currentNode.children.push(doctype) },

			onopencdata() { cdata = '<![CDATA[' },
			oncdata(data) { cdata += data },
			onclosecdata() { currentNode.children.push(cdata + ']]>') },

			onopentag(node) { currentNode = (new XmlNode(node)).pushTo(currentNode) },
			onclosetag() { currentNode = currentNode.parent },

			// onopennamespace() { console.log('<<', arguments) },
			// onclosenamespace() { console.log('>>', arguments) },

			onprocessinginstruction(pi) {
				// currentNode.children.push(`<?${name} ${body}?>`)
				if (!currentNode.processingInstructions)
					currentNode.processingInstructions = []
				currentNode.processingInstructions.push(pi)
			},

			onerror(error) { throw error },
		})

		parser.write(xml).close()
		return this
	}

	get innerText() {
		let text = ''
		for (let child of this.children)
			text += child instanceof XmlNode ? child.innerText() : child
		return text
	}


	toXml(pretty=false, indentLevel=0) {
		if (!this.name)
			indentLevel--
		const indent = indentLevel >= 0 ? '\t'.repeat(indentLevel) : ''
		const indentChild = '\t'.repeat(indentLevel+1)

		// attributes' xml
		let attributesXml = ''
		for (const name in this.attributes)
			attributesXml += ` ${name}="${replaceWithEntities(this.attributes[name])}"`


		// children's xml
		let childrenXml = ''

		if (this.processingInstructions) {
			for (const {name, body} of this.processingInstructions) {
				if (pretty) childrenXml += indentChild
				childrenXml += `<?${name} ${body}?>`
				if (pretty) childrenXml += '\n'
			}
		}
		
		for (const child of this.children) {
			if (child instanceof XmlNode)
				childrenXml += child.toXml(pretty, indentLevel+1)
			else
				childrenXml += (pretty ? indentChild : '') + replaceWithEntities(child)
			if (pretty) childrenXml += '\n'
		}


		// let's render
		if (!this.name)  // root
			return childrenXml

		if (!this.children.length)
			return (pretty ? indent : '') + '<' + this.name + attributesXml + '/>'

		if (pretty) {
			return indent
				+ '<' + this.name + attributesXml + '>'
				+ '\n'
				+ childrenXml
				+ indent
				+ '</' + this.name + '>'
		}

		return '<' + this.name + attributesXml + '>' + childrenXml + '</' + this.name + '>'
	}

	toXmlFile(filename, pretty) {
		const { writeFileSync } = require('fs')
		const content = this.toXml(pretty)
		writeFileSync(filename, content)
		return content
	}

	toJson() {
		return JSON.stringify(this.raw)
	}

	/**
	* Return the object without the informations about the parent
	*/
	get raw() {
		const rawThis = {
			name: this.name,
			attributes: this.attributes,
			children: this.children.map(child => child instanceof XmlNode ? child.raw : child)
		}
		if (this.processingInstructions)
			rawThis.processingInstructions = this.processingInstructions
		return rawThis
	}
}
XML.XmlNode = XmlNode

/**
* Return a function which match a node with the given expression
* The returned function returns the node itself if it matched, `null` otherwise
*/
function matcher(name='', attributes=[]) {
	// custom function
	if (typeof name == 'function')
		return name

	if (Array.isArray(name))
		attributes = name, name = ''

	attributes = attributes.map(getAttributeExpression)

	const attributesMatch = node => attributes.every(([name, expression]) => {
		for (const attr in node.attributes)
			if (name.test(attr) && expression.test(node.attributes[attr]))
				return true
		return false
	})

	// tag name
	const nameExpression = getExpression(name)
	return node =>
		node instanceof XmlNode
		&& nameExpression.test(node.name)
		&& attributesMatch(node)
		? node : null
}


/**
* Create a very simple regexp from a string (replace '*' and '?')
*/
function getExpression(str) {
	if (!str || str == '*') return /.*/
	if (str instanceof RegExp) return str
	str = String(str)
	return new RegExp('^' + str.replace(/\*/g, '.*') + '$')
}


/**
* Tranform an attribute query into a reusable object
*/
function getAttributeExpression(query) {
	const equal = query.indexOf('=')
	let name, expression
	if (equal == -1) {
		name = getExpression(query.trim())
		expression = /.*/
	}
	else {
		name = getExpression(query.slice(0, equal).trim())
		expression = getExpression(query.slice(equal+1).trim())
	}

	return [ name, expression ]
}


/**
* Replace some special symbols by their xml entities
*/
function replaceWithEntities(str) {
	if (typeof str != 'string')
		console.log('!', str)
	return str
		.replace(/&/g, '&amp;')  // must be the first to be replaced ; guess why :p
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
}

module.exports = XML
