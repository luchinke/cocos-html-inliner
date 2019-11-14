# Cocos HTML Inliner
A project to create a single minified html file of a Cocos Creator web-mobile project.

## Automatization build process
1. Create the build through the Cocos Creator editor.
2. Copy this project into the root folder of your cocos creator project.
2. `cd cocos-html-inliner/`
3. `npm install`(node v8.10.0)
3. `pip install -r requirements.txt` (python 3.6.2)
4. `python inline_html.py`

## Output
- Output files can be found inside 'cocos-html-inliner/build' folder.
- The html file is minified. All scripts and css are inlined and minified.
- The splashscreen is removed. 

## Caveats
- **Supports CocosCreator 1.9.3, 2.1 and 2.2**
- To restore the splashcreen as well as the 'auto enable full screen' feature, uncomment the desired lines of code from index.html and main.js inside templates folder.
- There is a publishers list and their behaviour inside inline_html.py. It's just a text replace for your cocos creator code. Use it wisely!
