import * as fs from "fs";
import * as XML from "../xml-artist";

describe("xml-artist", () => {
    it("should open, save and reload a file", () => {
        const tempFileName1 = "test/file-sample-output.xml";
        const tempFileName2 = "test/file-sample-output-2.xml";
        afterAll(() => {
            if(fs.existsSync(tempFileName1)) {
                fs.unlinkSync(tempFileName1);
            };
            if(fs.existsSync(tempFileName2)) {
                fs.unlinkSync(tempFileName2);
            };
        })
        let root = XML.parseFile('test/file-sample.xml', {trim: false});
        const toXML = root.toXml();
        root.toXmlFile(tempFileName1);
    	let root2 = XML.parseJson(root.toJson());
    	root2.toXmlFile(tempFileName2);
	    expect(root.toXml()).toEqual(root2.toXml());
    });

    it("should find and manimpulate elements", () => {
        let data = XML.parseFile('test/file-sample-B.xml', {trim: true});
        let heroes = data.find('heroes');
        let friends = heroes.findChild('friends');
        
        expect(heroes.findAll(['name=Zabu']).length).toEqual(2);
        expect(heroes.findAllChildren(['name=Zabu']).length).toEqual(1);
        expect(heroes.findAll(['class=warrior']).length).toEqual(4);
        expect(heroes.find('friends').findAll(['class=warrior']).length).toEqual(2);
    
        // Inner text
        expect(heroes.findChild(['name=Zabu']).innerText).toEqual('Zabu351321');

        // Glob matching
        expect(data.findAll('h*').length).toEqual(7);
        expect(heroes.findAll(['name=*c*']).length).toEqual(4);
        expect(heroes.findAll(['*n*=*b*']).length).toEqual(2);

        // Move elements
        for (let node of heroes.findAll(['name=Zabu'])) {
            node.replaceWith("Disappeared Zabu ahahah");
        }
	    expect(heroes.findAll(['name=Zabu']).length).toEqual(0);

	    heroes.find(['name=Hercule']).pushTo(heroes.find('friends'))
	    expect(heroes.findChild(['name=Hercule'])).toBeNull();
        expect(heroes.find('friends').findAllChildren(['name=Hercule']).length).toEqual(2);

        // Find parents
        var h = heroes.find(['name=Hercule'])
        expect(h.findParent('friends')).not.toBeNull();
        expect(h.findParent('heroes')).not.toBeNull();
        expect(h.findAllParents().length).toEqual(2);
    
        // Push array
        var heroesToMove = heroes.findAllChildren('hero')
        var numberOfFriends = friends.children.length
        friends.push(heroesToMove)
        expect(heroes.findAllChildren('hero').length).toEqual(0);
        expect(friends.children.length).toEqual(numberOfFriends + heroesToMove.length);
    
        // Replace with array
        var numberOfChildren = heroes.children.length - 1
        var numberOfCocos = friends.findAllChildren(['name=Coco']).length
        friends.replaceWith(friends.findAllChildren(['name=Coco']))
        expect(heroes.find('friends')).toBeNull();
        expect(heroes.children.length).toEqual(numberOfChildren + numberOfCocos);
        expect(heroes.findAllChildren(['name=Coco']).length).toEqual(numberOfCocos);
    });

    it("should read html", () => {
        let htmlRoot = XML.parseFile('test/html-sample.html', {trim: true, strict: false})
        expect(htmlRoot.findChild('p').children.length).toEqual(6);
    });

    it("should handle comment, doctype, cdata and walking", () => {
        let xml = XML.parseFile('test/file-sample-C.xml', {trim: true})
        let numberOfComments=0, numberOfTexts=0, numberOfTags=0, numberOfData=0, numberOfDocType=0
        xml.walk({
            text() { numberOfTexts++ },
            comment() { numberOfComments++ },
            node() { numberOfTags++ },
            cdata() { numberOfData++ },
            doctype() { numberOfDocType++ },
        });
        expect(numberOfTexts).toEqual(3);
        expect(numberOfComments).toEqual(3);
        expect(numberOfTags).toEqual(3);
        expect(numberOfData).toEqual(1);
        expect(numberOfDocType).toEqual(1);

        numberOfComments=0, numberOfTexts=0
        xml.walk(
            function() { numberOfTexts++ },
            function() { numberOfComments++ }
        );
        expect(numberOfTexts).toEqual(3);
        expect(numberOfComments).toEqual(3);
    });

});