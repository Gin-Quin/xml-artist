
Clean wrapper around the `sax` library to read, manipulate and render xml files like an artist.

*Quick example :*

```xml
<!-- input.xml -->
<heroes>
    <hero:ally name="Foo"/>
    <hero:enemy name="Bar"/>
    <hero:enemy/>
</heroes>
```

```javascript
const XML = require('xml-artist')

// we get the data from the given xml file
const data = XML.parseFile('input.xml')

// we find all nodes which name begin with `hero:` and which have the attribute `name`
// and we replace them by some text
for (const node of data.findAll('hero:*', ['name']))
    node.replaceWith(`I'm a hero and my name is ${node.attributes.name}`)

// we write the transformed xml to an output file
data.toXmlFile('output.xml')
```


```xml
<!-- output.xml -->
<heroes>
    I'm a hero and my name is Foo
    I'm a hero and my name is Bar
    <hero:enemy/>
</heroes>
```

Read more to discover the awesome versatility and ease-of-use of the library.


## Parse/read xml

There are several ways to create the data tree from xml data :

```javascript
const XML = require('xml-artist')

// with template strings
const data = XML `
    <heroes>
        <hero:ally name="Foo"/>
        <hero:enemy name="Bar"/>
        <hero:enemy/>
    </heroes>
`

// with the parse function
const data = XML.parse(xmlString, options?)

// read from a file
const data = XML.parseFile(filename, options?)

// create a node and then parse content
const { XmlNode } = XML
const root = new XmlNode
root.parse(xmlString, options?)

```

You can also get your `XmlNode` tree from previously created JSON data :

```javascript
const data = XML.parse(xmlString)
const json = data.toJson()
const sameDataButFromJson = XML.parseJson(json)
```

### Parsing options

The default options are :

``` typescript
{
    // set to false if you want to parse non-strict xml
    strict: true,

    // whether or not to trim text and comment nodes
    // (if you intend to pretty print, you should set it to true)
    trim: false,

    // if true, turn any whitespace into a single space
    normalize: false,

    // if true, lowercase tag and attribute names instead of uppercasing
    lowercase: true,

    // if true, only parse predefined XML entities
    // (&amp; &apos; &gt; &lt; and &quot;)
    strictEntities: false,
}
```


## The XmlNode object

### Properties

``` typescript
class XmlNode {
    name : String
    attributes : { [key : String] : String }
    children : [ XmlNode | String ]
    processingInstructions? : [ { name: String, body: String} ]
}
```

Every `XmlNode` has the field `children` which can contain plain text or other `XmlNode`s.

The `processingInstructions` field is not always defined and contains the `name` and `body` informations of tags which have the form : `<?${name} ${body}?>`.


### Finder methods

- `find(name: String|RegExp)` : return the first XmlNode with the matching name, or `null` if no result is found.
- `find(attributes: [String])` : same, but take an array of attributes as argument. *Exemple :* `find(['id', 'class=foo*'])` will find the first node which have the attribute `id` and a value beginning by 'foo' for the attribute `class`.
- `find(name: String|RegExp, attributes: [String])` : same, but with conditions on the name and the attributes. 
- `find(callback: Function)` : You can also specifiy your own function to match the desired node. Your function must return the node itself it is valid, or a null value otherwise.

The `find` function has three brothers, which all take the same arguments :

- `findAll` : return an array of nodes instead of the first one.
- `findChild` : do not search recursively, only amongst direct children. Return the first result.
- `findAllChild` : Return all the result amongst direct children only.

Every string passed to these functions will be transformed into regular expressions with this very simple rule : all `*` characters will be treated as `.*`

Be aware that if you use special characters (like `[`, `]`) they will be treated as part of the regular expression unless you double-escape them.


### Walk method

- `walk(xmlNodeCallback: Function, textCallback?: Function)` : let you walk recursively through the tree with two callback functions. Every `XmlNode` will be passed to the first one, and every `text`/`comment`/`cdata` will be passed to the second one. This function returns the first non-null result received by one of the callback functions.


### Tree mutator methods

- `replaceWith(element: XmlNode|String)` : replace an element by another one. *Note :* if the element already belonged to the tree, it is moved (not copied). If you want to create a copy, use the `clone` method first.
- `clone()` : create a copy of an element. Every children will be cloned too.
- `remove()` : self-remove from the tree.
- `removeChild(element: XmlNode|String)` : remove the given child element.
- `push(element: XmlNode|String, before?: Integer|XmlNode)` : push a new child. The `before` parameter indicates before which XmlNode element (or index) the new child should be pushed.
- `pushTo(element: XmlNode, before?: Integer|XmlNode)` : move itself as a new child to the given XmlNode.
- `empty()` : remove every children.

### Renderer methods

- `toXml(pretty: Boolean)` : Generate XML, pretty-printed or not. If you want to pretty-print your xml, you should consider to set the `trim` option to `true` when parsing.
- `toXmlFile(filename: String, pretty: Boolean)` : Generate XML and write it to the given file.
- `toJson()` : Create clean and reusable JSON.


<br>

*Be an artist*