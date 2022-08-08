//import { Canvg } from 'canvg';
import { Canvg, presets} from 'canvg';
import VerovioScoreEditor from 'verovioscoreeditor';
import {
  jQuery as $, JoubelUI as UI, Question
} 
from "./globals";


// CSS Classes
const MAIN_CONTAINER = 'h5p-essay-input-field';
const INPUT_LABEL = 'h5p-essay-input-field-label';
const INPUT_FIELD = 'h5p-essay-input-field-textfield';
const WRAPPER_MESSAGE = 'h5p-essay-input-field-message-wrapper';
const CHAR_MESSAGE = 'h5p-essay-input-field-message-char';
const CHAR_MESSAGE_IMPORTANT = 'h5p-essay-input-field-message-char-important';
const SAVE_MESSAGE = 'h5p-essay-input-field-message-save';
const ANIMATION_MESSAGE = 'h5p-essay-input-field-message-save-animation';
const EMPTY_MESSAGE = '&nbsp;';

const preset = presets.offscreen();

export default class EssayinputField{
  /**
   * @constructor
   * @param {object} params - Parameters.
   * @param {number} [params.inputFieldSize] - Number of rows for inputfield.
   * @param {number} [params.maximumLength] - Maximum text length.
   * @param {string} [params.placeholderText] - Placeholder text for input field.
   * @param {string} [params.remainingChars] - Label for remaining chars information.
   * @param {string} [params.taskDescription] - Task description (HTML).
   * @param {object} [params.previousState] - Content state of previous attempt.
   * @param {object} [callbacks] - Callbacks.
   * @param {function} [callbacks.onInteracted] - Interacted callback.
   */
  constructor(params, callbacks) {
    var that = this;
    this.currentAttachedElement = undefined;
    this.usedIds = [];
    this.params = params;
    this.previousState = params.previousState || '';

    // Callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onInteracted = this.callbacks.onInteracted || (function () {});

    // Sanitization
    this.params.taskDescription = this.params.taskDescription || '';
    //this.params.placeholderText = this.params.placeholderText || '';
    this.params.taskDescriptionScore = this.params.taskDescriptionScore || '';

    // Task description
    this.taskDescription = document.createElement('div');
    this.taskDescription.classList.add(INPUT_LABEL);
    this.taskDescription.innerHTML = this.params.taskDescription;
    
   /*const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const v = Canvg.fromString(ctx, '<svg width="600" height="600"><text x="50" y="50">Hello World!</text></svg>');

  
        v.start();*/
   
  this.vseInstances = [];

    
    // InputField
    this.inputField = document.createElement('textarea');
    this.inputField.classList.add(INPUT_FIELD);
    //this.inputField.setAttribute('rows', this.params.inputFieldSize);
    //this.inputField.setAttribute('maxlength', this.params.maximumLength);
   // this.inputField.setAttribute('placeholder', this.params.placeholderText);
    this.setText(this.previousState);
    this.oldValue = this.previousState;

    this.containsText = this.oldValue.length > 0;

    // Interacted listener
    this.inputField.addEventListener('blur', function () {
      if (that.oldValue !== that.getText()) {
        that.callbacks.onInteracted({ updateScore: true });
      }

      that.oldValue = that.getText();
      console.log("that.getText() blur");
      console.log(that.getText());
    });

    /*
     * Extra listener required to be used in QuestionSet properly
     */
    this.inputField.addEventListener('input', function () {
      if (
        that.containsText && that.getText().length === 0 ||
        !that.containsText && that.getText().length > 0
      ) {
        that.callbacks.onInteracted();
      }

      that.containsText = that.getText().length > 0;
      
      console.log("addEventListener input");
      console.log(that.getText());
    });

    this.content = document.createElement('div');
    //* ************************************************* */
    this.content.appendChild(this.inputField);
    //this.content.appendChild(canvas);
   
   
    var score = document.createElement('div');  
   score.setAttribute('id', 'vseDesc');
   var vse = new VerovioScoreEditor(score, {data: this.params.taskDescriptionScore});
   this.content.appendChild(score);
   this.vseInstances.push(vse);
   
    //var test = document.createElement('canvas');
    //this.content.appendChild(test);

    // Container
    this.container = document.createElement('div');
    this.container.classList.add(MAIN_CONTAINER);
    
    
    document.addEventListener("DOMContentLoaded", function(event) {
    console.log("DOM fully loaded and parsed");
  });
  
 
     console.log('test8');
     
     /*async function start() {
     
  const canvas = document.querySelector('canvas')
  console.log(canvas);
  const ctx = canvas.getContext('2d')
  const v = Canvg.fromString(ctx, '<svg width="600" height="600"><text x="50" y="50">Hello World!</text></svg>');//await Canvg.from(ctx, './example.svg')

  // Start SVG rendering with animations and mouse handling.
  v.start()

  window.onbeforeunload = () => {
    v.stop()
  }
}

start()*/


//* ************************* */
   /* var width = $(window).width();
    var height = $(window).height();
    
    var element = document.createElement('canvas');
    this.content.appendChild(element); 

    this.contextTest = element.getContext("2d");
  
  $(this.loadObservers.bind(this));*/
  //* ************************* */
 
  
  
  //this.start();
  
  console.log('inputfield8');
  
  
  var elementSVG = document.createElement('img');
  this.content.appendChild(elementSVG);
  
  $(this.loadObservers.bind(this));
  
  
 
  
 /* window.onload = () => {
        console.log('window.onload 1');
        const canvas = document.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const v = Canvg.fromString(ctx, '<svg width="600" height="600"><text x="50" y="50">Hello World!</text></svg>');
//const v = Canvg.fromStringm(ctx, '<svg id="rootSVG" viewBox="0 0 654 303.171875" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:mei="http://www.music-encoding.org/ns/mei" overflow="visible" preserveAspectRatio="xMidYMid meet">   <desc>Engraved by Verovio 3.6.0-e61210e</desc>   <defs>      <symbol id="E050-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M364 -252c-245 0 -364 165 -364 339c0 202 153 345 297 464c12 10 11 12 9 24c-7 41 -14 106 -14 164c0 104 24 229 98 311c20 22 51 48 65 48c11 0 37 -28 52 -50c41 -60 65 -146 65 -233c0 -153 -82 -280 -190 -381c-6 -6 -8 -7 -6 -19l25 -145c3 -18 3 -18 29 -18 c147 0 241 -113 241 -241c0 -113 -67 -198 -168 -238c-14 -6 -15 -5 -13 -17c11 -62 29 -157 29 -214c0 -170 -130 -200 -197 -200c-151 0 -190 98 -190 163c0 62 40 115 107 115c61 0 96 -47 96 -102c0 -58 -36 -85 -67 -94c-23 -7 -32 -10 -32 -17c0 -13 26 -29 80 -29 c59 0 159 18 159 166c0 47 -15 134 -27 201c-2 12 -4 11 -15 9c-20 -4 -46 -6 -69 -6zM80 20c0 -139 113 -236 288 -236c20 0 40 2 56 5c15 3 16 3 14 14l-50 298c-2 11 -4 12 -20 8c-61 -17 -100 -60 -100 -117c0 -46 30 -89 72 -107c7 -3 15 -6 15 -13 c0 -6 -4 -11 -12 -11c-7 0 -19 3 -27 6c-68 23 -115 87 -115 177c0 85 57 164 145 194c18 6 18 5 15 24l-21 128c-2 11 -4 12 -14 4c-47 -38 -93 -75 -153 -142c-83 -94 -93 -173 -93 -232zM470 943c-61 0 -133 -96 -133 -252c0 -32 2 -66 6 -92c2 -13 6 -14 13 -8 c79 69 174 159 174 270c0 55 -27 82 -60 82zM441 117c-12 1 -13 -2 -11 -14l49 -285c2 -12 4 -12 16 -6c56 28 94 79 94 142c0 88 -67 156 -148 163z"/>      </symbol>      <symbol id="E084-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M40 -112c-12 0 -20 7 -20 17c0 3 1 7 3 11c0 1 1 2 1 3l6 8c30 42 128 181 128 305c0 16 14 19 23 19c8 0 53 -2 71 -2s59 2 68 2c8 0 15 -6 15 -14c0 -2 -1 -3 -1 -5c-3 -11 -163 -238 -243 -306h135v84c0 12 5 18 9 23l95 115c6 7 11 9 20 9c11 0 12 -9 12 -17v-214h73 c11 0 15 -7 15 -19s-5 -19 -15 -19h-73v-59c0 -32 21 -38 31 -38s22 -6 22 -20s-10 -21 -20 -21h-213c-15 0 -19 11 -19 21s7 19 23 19c18 0 40 8 40 35v63h-186z"/>      </symbol>      <symbol id="E0A3-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M97 -125c-55 0 -97 30 -97 83c0 52 47 167 196 167c58 0 99 -32 99 -83c0 -33 -33 -167 -198 -167zM29 -44c0 -7 3 -14 6 -20c7 -12 19 -23 40 -23c48 0 189 88 189 131c0 7 -3 13 -6 19c-7 12 -18 21 -37 21c-47 0 -192 -79 -192 -128z"/>      </symbol>   </defs>   <style type="text/css">g.page-margin{font-family:Times;} g.ending, g.reh, g.tempo{font-weight:bold;} g.dir, g.dynam, g.mNum{font-style:italic;} g.label{font-weight:normal;}</style>   <svg class="definition-scale" color="black" viewBox="0 0 4530 2100">      <g class="page-margin" transform="translate(500, 1000)" id="A590856a2aa7d9b41d7c9e03da542c75049a4">         <g id="ml9wpbr" class="mdiv pageElementStart">            <g id="bbox-ml9wpbr" class="bounding-box bbmdiv"/>         </g>         <g id="sjokyv4" class="score pageElementStart">            <g id="bbox-sjokyv4" class="bounding-box bbscore"/>         </g>         <g id="sopo5mf" class="system">            <g id="bbox-sopo5mf" class="system bounding-box"/>            <g id="sn5yghw" class="section systemElementStart"/>            <g id="mtc9dz4" class="measure">               <g id="bbox-mtc9dz4" class="measure bounding-box"/>               <g id="sdl36yz" class="staff">                  <g id="bbox-sdl36yz" class="bounding-box bbstaff">                     <rect x="-7" y="-7" height="733" width="3548" fill="transparent" id="A26fe29c0a19afb434ecbb90ddf4da89f213a"/>                  </g>                  <path d="M0 0 L3535 0" stroke="currentColor" stroke-width="13" id="A417fa8baa9637b422ccaa04d8863e0f897d9"/>                  <path d="M0 180 L3535 180" stroke="currentColor" stroke-width="13" id="A5e363970aa24eb4fe4c8632d6173ea8191c2"/>                  <path d="M0 360 L3535 360" stroke="currentColor" stroke-width="13" id="A7f15f3abaed2ab4cb9c9872d87abca192e89"/>                  <path d="M0 540 L3535 540" stroke="currentColor" stroke-width="13" id="A8de8123ba5fe0b47a0cbeb1d4d229940e5ce"/>                  <path d="M0 720 L3535 720" stroke="currentColor" stroke-width="13" id="Ac19f4f0ca6ee1b4159cba0fd38945c8b283b"/>                  <g id="c39omrw" class="clef">                     <g id="bbox-c39omrw" class="bounding-box bbclef">                        <rect x="90" y="-251" height="1264" width="483" fill="transparent" id="A4e67e88eaf6ebb4d49c92d8d5b26d0079eb9"/>                     </g>                     <use href="#E050-lcbipt" x="90" y="540" height="720px" width="720px" id="Adccdc5eba3228b4675cbc33d3394c9e67780"/>                  </g>                  <g id="mtl66dx" class="meterSig">                     <g id="bbox-mtl66dx" class="bounding-box bbmeterSig">                        <rect x="843" y="0" height="720" width="309" fill="transparent" id="A1e60a647a166fb4a93ca305d3ed0feb343f6"/>                     </g>                     <use href="#E084-lcbipt" x="829" y="180" height="720px" width="720px" id="Ae8312044afacbb4b0acaa74dac88b1b10e1c"/>                     <use href="#E084-lcbipt" x="829" y="540" height="720px" width="720px" id="A83c65b12a1414b42a4c9941d5189c7a520d2"/>                  </g>                  <g id="l3muux8" class="layer">                     <g id="bbox-l3muux8" class="layer bounding-box"/>                     <g id="Ab6b5b0a3a8b9bb48fac81e4daa720fb206e6" class="note">                        <g id="bbox-Ab6b5b0a3a8b9bb48fac81e4daa720fb206e6" class="bounding-box bbnote">                           <rect x="1422" y="270" height="180" width="212" fill="transparent" id="A0ede8657aeda9b42e9c8ad6dab986366ff66"/>                        </g>                        <g class="notehead" id="A7be854c3aa901b4bc5cb307d4b7a45bb8c63">                           <use href="#E0A3-lcbipt" x="1422" y="360" height="720px" width="720px" id="A517b0a8ba652cb44d4cb69ed0bfb7ffd24cc"/>                        </g>                        <g id="s3w33vg" class="stem">                           <g id="bbox-s3w33vg" class="bounding-box bbstem">                              <rect x="1422" y="390" height="570" width="18" fill="transparent" id="A29947debabc8db40b1c8142d01b7b1760bdb"/>                           </g>                           <rect x="1422" y="390" height="570" width="18" id="A952b3523abea5b4406cb09dd13174fd45db9"/>                        </g>                     </g>                     <g id="Aa2b0ab24a4e45b4299cad84dd4d4c092d7ad" class="note">                        <g id="bbox-Aa2b0ab24a4e45b4299cad84dd4d4c092d7ad" class="bounding-box bbnote">                           <rect x="2472" y="630" height="180" width="212" fill="transparent" id="Ae08989deab897b47bdcb600d1a68ade17987"/>                        </g>                        <g class="notehead" id="A5152a53fa7de0b4cd4c8b24d6ea00b15c2a4">                           <use href="#E0A3-lcbipt" x="2472" y="720" height="720px" width="720px" id="A2214ee95a1646b4d43ca52dd4e5d4686e4ca"/>                        </g>                        <g id="sqrqram" class="stem">                           <g id="bbox-sqrqram" class="bounding-box bbstem">                              <rect x="2666" y="90" height="600" width="18" fill="transparent" id="A30d1802aae0d1b4d5dcb10bd57cf8e627cf6"/>                           </g>                           <rect x="2666" y="90" height="600" width="18" id="A691d55e3a3ed3b4719c93bbd564b84932820"/>                        </g>                     </g>                  </g>               </g>               <g id="bbnvvrm" class="barLine">                  <g id="bbox-bbnvvrm" class="bounding-box bbbarLine">                     <rect x="3508" y="-14" height="747" width="27" fill="transparent" id="Ad21c6766a38edb43d4c91ead03065491258a"/>                  </g>                  <path d="M3522 720 L3522 0" stroke="currentColor" stroke-width="27" id="Aa09b6f5cab299b4d44ca02fdf8876e663a14"/>               </g>            </g>            <g id="s13by9g" class="systemElementEnd sn5yghw"/>         </g>         <g id="plnlgon" class="pageElementEnd sjokyv4">            <g id="bbox-plnlgon" class="pageElementEnd bounding-box"/>         </g>         <g id="phncxf3" class="pageElementEnd ml9wpbr">            <g id="bbox-phncxf3" class="pageElementEnd bounding-box"/>         </g>      </g>   </svg></svg>');
    
        // Start SVG rendering with animations and mouse handling.
        v.start();
      };
  */
  /*var elementSVG = document.createElement('canvas');
  this.content.appendChild(elementSVG);
  this.start();*/
  
 // async function start() {
    
    
    /*var width = $(window).width();
    var height = $(window).height();
    var element = document.createElement('canvas');
    $(element)
       .attr('id', 'background')
       .text('unsupported browser')
       .width(width)
       .height(height)
       .appendTo('body');

    var context = element.getContext("2d");*/
    
   
   // var contextTest = element.getContext("2d");
     
   // const v = await Canvg.from(contextTest, '<svg id="rootSVG" viewBox="0 0 654 303.171875" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:mei="http://www.music-encoding.org/ns/mei" overflow="visible" preserveAspectRatio="xMidYMid meet">   <desc>Engraved by Verovio 3.6.0-e61210e</desc>   <defs>      <symbol id="E050-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M364 -252c-245 0 -364 165 -364 339c0 202 153 345 297 464c12 10 11 12 9 24c-7 41 -14 106 -14 164c0 104 24 229 98 311c20 22 51 48 65 48c11 0 37 -28 52 -50c41 -60 65 -146 65 -233c0 -153 -82 -280 -190 -381c-6 -6 -8 -7 -6 -19l25 -145c3 -18 3 -18 29 -18 c147 0 241 -113 241 -241c0 -113 -67 -198 -168 -238c-14 -6 -15 -5 -13 -17c11 -62 29 -157 29 -214c0 -170 -130 -200 -197 -200c-151 0 -190 98 -190 163c0 62 40 115 107 115c61 0 96 -47 96 -102c0 -58 -36 -85 -67 -94c-23 -7 -32 -10 -32 -17c0 -13 26 -29 80 -29 c59 0 159 18 159 166c0 47 -15 134 -27 201c-2 12 -4 11 -15 9c-20 -4 -46 -6 -69 -6zM80 20c0 -139 113 -236 288 -236c20 0 40 2 56 5c15 3 16 3 14 14l-50 298c-2 11 -4 12 -20 8c-61 -17 -100 -60 -100 -117c0 -46 30 -89 72 -107c7 -3 15 -6 15 -13 c0 -6 -4 -11 -12 -11c-7 0 -19 3 -27 6c-68 23 -115 87 -115 177c0 85 57 164 145 194c18 6 18 5 15 24l-21 128c-2 11 -4 12 -14 4c-47 -38 -93 -75 -153 -142c-83 -94 -93 -173 -93 -232zM470 943c-61 0 -133 -96 -133 -252c0 -32 2 -66 6 -92c2 -13 6 -14 13 -8 c79 69 174 159 174 270c0 55 -27 82 -60 82zM441 117c-12 1 -13 -2 -11 -14l49 -285c2 -12 4 -12 16 -6c56 28 94 79 94 142c0 88 -67 156 -148 163z"/>      </symbol>      <symbol id="E084-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M40 -112c-12 0 -20 7 -20 17c0 3 1 7 3 11c0 1 1 2 1 3l6 8c30 42 128 181 128 305c0 16 14 19 23 19c8 0 53 -2 71 -2s59 2 68 2c8 0 15 -6 15 -14c0 -2 -1 -3 -1 -5c-3 -11 -163 -238 -243 -306h135v84c0 12 5 18 9 23l95 115c6 7 11 9 20 9c11 0 12 -9 12 -17v-214h73 c11 0 15 -7 15 -19s-5 -19 -15 -19h-73v-59c0 -32 21 -38 31 -38s22 -6 22 -20s-10 -21 -20 -21h-213c-15 0 -19 11 -19 21s7 19 23 19c18 0 40 8 40 35v63h-186z"/>      </symbol>      <symbol id="E0A3-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M97 -125c-55 0 -97 30 -97 83c0 52 47 167 196 167c58 0 99 -32 99 -83c0 -33 -33 -167 -198 -167zM29 -44c0 -7 3 -14 6 -20c7 -12 19 -23 40 -23c48 0 189 88 189 131c0 7 -3 13 -6 19c-7 12 -18 21 -37 21c-47 0 -192 -79 -192 -128z"/>      </symbol>   </defs>   <style type="text/css">g.page-margin{font-family:Times;} g.ending, g.reh, g.tempo{font-weight:bold;} g.dir, g.dynam, g.mNum{font-style:italic;} g.label{font-weight:normal;}</style>   <svg class="definition-scale" color="black" viewBox="0 0 4530 2100">      <g class="page-margin" transform="translate(500, 1000)" id="A590856a2aa7d9b41d7c9e03da542c75049a4">         <g id="ml9wpbr" class="mdiv pageElementStart">            <g id="bbox-ml9wpbr" class="bounding-box bbmdiv"/>         </g>         <g id="sjokyv4" class="score pageElementStart">            <g id="bbox-sjokyv4" class="bounding-box bbscore"/>         </g>         <g id="sopo5mf" class="system">            <g id="bbox-sopo5mf" class="system bounding-box"/>            <g id="sn5yghw" class="section systemElementStart"/>            <g id="mtc9dz4" class="measure">               <g id="bbox-mtc9dz4" class="measure bounding-box"/>               <g id="sdl36yz" class="staff">                  <g id="bbox-sdl36yz" class="bounding-box bbstaff">                     <rect x="-7" y="-7" height="733" width="3548" fill="transparent" id="A26fe29c0a19afb434ecbb90ddf4da89f213a"/>                  </g>                  <path d="M0 0 L3535 0" stroke="currentColor" stroke-width="13" id="A417fa8baa9637b422ccaa04d8863e0f897d9"/>                  <path d="M0 180 L3535 180" stroke="currentColor" stroke-width="13" id="A5e363970aa24eb4fe4c8632d6173ea8191c2"/>                  <path d="M0 360 L3535 360" stroke="currentColor" stroke-width="13" id="A7f15f3abaed2ab4cb9c9872d87abca192e89"/>                  <path d="M0 540 L3535 540" stroke="currentColor" stroke-width="13" id="A8de8123ba5fe0b47a0cbeb1d4d229940e5ce"/>                  <path d="M0 720 L3535 720" stroke="currentColor" stroke-width="13" id="Ac19f4f0ca6ee1b4159cba0fd38945c8b283b"/>                  <g id="c39omrw" class="clef">                     <g id="bbox-c39omrw" class="bounding-box bbclef">                        <rect x="90" y="-251" height="1264" width="483" fill="transparent" id="A4e67e88eaf6ebb4d49c92d8d5b26d0079eb9"/>                     </g>                     <use href="#E050-lcbipt" x="90" y="540" height="720px" width="720px" id="Adccdc5eba3228b4675cbc33d3394c9e67780"/>                  </g>                  <g id="mtl66dx" class="meterSig">                     <g id="bbox-mtl66dx" class="bounding-box bbmeterSig">                        <rect x="843" y="0" height="720" width="309" fill="transparent" id="A1e60a647a166fb4a93ca305d3ed0feb343f6"/>                     </g>                     <use href="#E084-lcbipt" x="829" y="180" height="720px" width="720px" id="Ae8312044afacbb4b0acaa74dac88b1b10e1c"/>                     <use href="#E084-lcbipt" x="829" y="540" height="720px" width="720px" id="A83c65b12a1414b42a4c9941d5189c7a520d2"/>                  </g>                  <g id="l3muux8" class="layer">                     <g id="bbox-l3muux8" class="layer bounding-box"/>                     <g id="Ab6b5b0a3a8b9bb48fac81e4daa720fb206e6" class="note">                        <g id="bbox-Ab6b5b0a3a8b9bb48fac81e4daa720fb206e6" class="bounding-box bbnote">                           <rect x="1422" y="270" height="180" width="212" fill="transparent" id="A0ede8657aeda9b42e9c8ad6dab986366ff66"/>                        </g>                        <g class="notehead" id="A7be854c3aa901b4bc5cb307d4b7a45bb8c63">                           <use href="#E0A3-lcbipt" x="1422" y="360" height="720px" width="720px" id="A517b0a8ba652cb44d4cb69ed0bfb7ffd24cc"/>                        </g>                        <g id="s3w33vg" class="stem">                           <g id="bbox-s3w33vg" class="bounding-box bbstem">                              <rect x="1422" y="390" height="570" width="18" fill="transparent" id="A29947debabc8db40b1c8142d01b7b1760bdb"/>                           </g>                           <rect x="1422" y="390" height="570" width="18" id="A952b3523abea5b4406cb09dd13174fd45db9"/>                        </g>                     </g>                     <g id="Aa2b0ab24a4e45b4299cad84dd4d4c092d7ad" class="note">                        <g id="bbox-Aa2b0ab24a4e45b4299cad84dd4d4c092d7ad" class="bounding-box bbnote">                           <rect x="2472" y="630" height="180" width="212" fill="transparent" id="Ae08989deab897b47bdcb600d1a68ade17987"/>                        </g>                        <g class="notehead" id="A5152a53fa7de0b4cd4c8b24d6ea00b15c2a4">                           <use href="#E0A3-lcbipt" x="2472" y="720" height="720px" width="720px" id="A2214ee95a1646b4d43ca52dd4e5d4686e4ca"/>                        </g>                        <g id="sqrqram" class="stem">                           <g id="bbox-sqrqram" class="bounding-box bbstem">                              <rect x="2666" y="90" height="600" width="18" fill="transparent" id="A30d1802aae0d1b4d5dcb10bd57cf8e627cf6"/>                           </g>                           <rect x="2666" y="90" height="600" width="18" id="A691d55e3a3ed3b4719c93bbd564b84932820"/>                        </g>                     </g>                  </g>               </g>               <g id="bbnvvrm" class="barLine">                  <g id="bbox-bbnvvrm" class="bounding-box bbbarLine">                     <rect x="3508" y="-14" height="747" width="27" fill="transparent" id="Ad21c6766a38edb43d4c91ead03065491258a"/>                  </g>                  <path d="M3522 720 L3522 0" stroke="currentColor" stroke-width="27" id="Aa09b6f5cab299b4d44ca02fdf8876e663a14"/>               </g>            </g>            <g id="s13by9g" class="systemElementEnd sn5yghw"/>         </g>         <g id="plnlgon" class="pageElementEnd sjokyv4">            <g id="bbox-plnlgon" class="pageElementEnd bounding-box"/>         </g>         <g id="phncxf3" class="pageElementEnd ml9wpbr">            <g id="bbox-phncxf3" class="pageElementEnd bounding-box"/>         </g>      </g>   </svg></svg>');
    
  // Start SVG rendering with animations and mouse handling.
  //v.start();

 // window.onbeforeunload = () => {
 //   v.stop();
 // }
//}


  
   
     /*window.addEventListener("load", function(event) {
    console.log("Alle Ressourcen haben das Laden beendet!");
  });*/
    //console.log(vse);
   /* $(vse.getCore()).ready(function(){
    console.log("Page loaded**********");
    console.log(document);
    
    var testSVG = document.getElementById('vseDesc');   
    console.log(testSVG);
    
  $('#vseDesc').load(function(){
  console.log("Page loaded.");
    alert("Page loaded.");
  });
});*/
    //var scoreCore = vse.getCore();
    //console.log(scoreCore);
    /*scoreCore.addEventListener("load", function(event) {
    console.log("Alle Ressourcen haben das Laden beendet!");
  });
    */
   /* vse.onload = function(){
        
        console.log("Page loaded");
    };*/
    
   /* vse.addEventListener("load", function(event) {
    console.log("Alle Ressourcen haben das Laden beendet!");
  });*/
   /* window.addEventListener("load", function(event) {
    console.log("Alle Ressourcen haben das Laden beendet!");
  });*/
  /*  
    $(document).ready(function(){
    console.log("Page loaded**********");
  $('#svg_output').load(function(){
  console.log("Page loaded.");
    alert("Page loaded.");
  });
});*/
    
  
   
   
   
   
   
    /*if (params.statusBar) {
      var statusWrapper = document.createElement('div');
      statusWrapper.classList.add(WRAPPER_MESSAGE);

      this.statusChars = document.createElement('div');
      this.statusChars.classList.add(CHAR_MESSAGE);

      statusWrapper.appendChild(this.statusChars);

      ['change', 'keyup', 'paste'].forEach(function (event) {
        that.inputField.addEventListener(event, function () {
          that.updateMessageSaved('');
          that.updateMessageChars();
        });
      });

      this.statusSaved = document.createElement('div');
      this.statusSaved.classList.add(SAVE_MESSAGE);
      statusWrapper.appendChild(this.statusSaved);

      this.content.appendChild(statusWrapper);

      this.updateMessageChars();
    }*/
  };
  
  async start() {
  //const canvas = document.querySelector('canvas')
  
  console.log('async function start 4');
  var elementSVG = document.querySelector('canvas');
  //this.content.appendChild(this.elementSVG );
  
  
  var contextTest = elementSVG.getContext("2d");
     
   const v = await Canvg.from(contextTest, '<svg id="rootSVG" viewBox="0 0 654 303.171875" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:mei="http://www.music-encoding.org/ns/mei" overflow="visible" preserveAspectRatio="xMidYMid meet">   <desc>Engraved by Verovio 3.6.0-e61210e</desc>   <defs>      <symbol id="E050-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M364 -252c-245 0 -364 165 -364 339c0 202 153 345 297 464c12 10 11 12 9 24c-7 41 -14 106 -14 164c0 104 24 229 98 311c20 22 51 48 65 48c11 0 37 -28 52 -50c41 -60 65 -146 65 -233c0 -153 -82 -280 -190 -381c-6 -6 -8 -7 -6 -19l25 -145c3 -18 3 -18 29 -18 c147 0 241 -113 241 -241c0 -113 -67 -198 -168 -238c-14 -6 -15 -5 -13 -17c11 -62 29 -157 29 -214c0 -170 -130 -200 -197 -200c-151 0 -190 98 -190 163c0 62 40 115 107 115c61 0 96 -47 96 -102c0 -58 -36 -85 -67 -94c-23 -7 -32 -10 -32 -17c0 -13 26 -29 80 -29 c59 0 159 18 159 166c0 47 -15 134 -27 201c-2 12 -4 11 -15 9c-20 -4 -46 -6 -69 -6zM80 20c0 -139 113 -236 288 -236c20 0 40 2 56 5c15 3 16 3 14 14l-50 298c-2 11 -4 12 -20 8c-61 -17 -100 -60 -100 -117c0 -46 30 -89 72 -107c7 -3 15 -6 15 -13 c0 -6 -4 -11 -12 -11c-7 0 -19 3 -27 6c-68 23 -115 87 -115 177c0 85 57 164 145 194c18 6 18 5 15 24l-21 128c-2 11 -4 12 -14 4c-47 -38 -93 -75 -153 -142c-83 -94 -93 -173 -93 -232zM470 943c-61 0 -133 -96 -133 -252c0 -32 2 -66 6 -92c2 -13 6 -14 13 -8 c79 69 174 159 174 270c0 55 -27 82 -60 82zM441 117c-12 1 -13 -2 -11 -14l49 -285c2 -12 4 -12 16 -6c56 28 94 79 94 142c0 88 -67 156 -148 163z"/>      </symbol>      <symbol id="E084-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M40 -112c-12 0 -20 7 -20 17c0 3 1 7 3 11c0 1 1 2 1 3l6 8c30 42 128 181 128 305c0 16 14 19 23 19c8 0 53 -2 71 -2s59 2 68 2c8 0 15 -6 15 -14c0 -2 -1 -3 -1 -5c-3 -11 -163 -238 -243 -306h135v84c0 12 5 18 9 23l95 115c6 7 11 9 20 9c11 0 12 -9 12 -17v-214h73 c11 0 15 -7 15 -19s-5 -19 -15 -19h-73v-59c0 -32 21 -38 31 -38s22 -6 22 -20s-10 -21 -20 -21h-213c-15 0 -19 11 -19 21s7 19 23 19c18 0 40 8 40 35v63h-186z"/>      </symbol>      <symbol id="E0A3-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M97 -125c-55 0 -97 30 -97 83c0 52 47 167 196 167c58 0 99 -32 99 -83c0 -33 -33 -167 -198 -167zM29 -44c0 -7 3 -14 6 -20c7 -12 19 -23 40 -23c48 0 189 88 189 131c0 7 -3 13 -6 19c-7 12 -18 21 -37 21c-47 0 -192 -79 -192 -128z"/>      </symbol>   </defs>   <style type="text/css">g.page-margin{font-family:Times;} g.ending, g.reh, g.tempo{font-weight:bold;} g.dir, g.dynam, g.mNum{font-style:italic;} g.label{font-weight:normal;}</style>   <svg class="definition-scale" color="black" viewBox="0 0 4530 2100">      <g class="page-margin" transform="translate(500, 1000)" id="A590856a2aa7d9b41d7c9e03da542c75049a4">         <g id="ml9wpbr" class="mdiv pageElementStart">            <g id="bbox-ml9wpbr" class="bounding-box bbmdiv"/>         </g>         <g id="sjokyv4" class="score pageElementStart">            <g id="bbox-sjokyv4" class="bounding-box bbscore"/>         </g>         <g id="sopo5mf" class="system">            <g id="bbox-sopo5mf" class="system bounding-box"/>            <g id="sn5yghw" class="section systemElementStart"/>            <g id="mtc9dz4" class="measure">               <g id="bbox-mtc9dz4" class="measure bounding-box"/>               <g id="sdl36yz" class="staff">                  <g id="bbox-sdl36yz" class="bounding-box bbstaff">                     <rect x="-7" y="-7" height="733" width="3548" fill="transparent" id="A26fe29c0a19afb434ecbb90ddf4da89f213a"/>                  </g>                  <path d="M0 0 L3535 0" stroke="currentColor" stroke-width="13" id="A417fa8baa9637b422ccaa04d8863e0f897d9"/>                  <path d="M0 180 L3535 180" stroke="currentColor" stroke-width="13" id="A5e363970aa24eb4fe4c8632d6173ea8191c2"/>                  <path d="M0 360 L3535 360" stroke="currentColor" stroke-width="13" id="A7f15f3abaed2ab4cb9c9872d87abca192e89"/>                  <path d="M0 540 L3535 540" stroke="currentColor" stroke-width="13" id="A8de8123ba5fe0b47a0cbeb1d4d229940e5ce"/>                  <path d="M0 720 L3535 720" stroke="currentColor" stroke-width="13" id="Ac19f4f0ca6ee1b4159cba0fd38945c8b283b"/>                  <g id="c39omrw" class="clef">                     <g id="bbox-c39omrw" class="bounding-box bbclef">                        <rect x="90" y="-251" height="1264" width="483" fill="transparent" id="A4e67e88eaf6ebb4d49c92d8d5b26d0079eb9"/>                     </g>                     <use href="#E050-lcbipt" x="90" y="540" height="720px" width="720px" id="Adccdc5eba3228b4675cbc33d3394c9e67780"/>                  </g>                  <g id="mtl66dx" class="meterSig">                     <g id="bbox-mtl66dx" class="bounding-box bbmeterSig">                        <rect x="843" y="0" height="720" width="309" fill="transparent" id="A1e60a647a166fb4a93ca305d3ed0feb343f6"/>                     </g>                     <use href="#E084-lcbipt" x="829" y="180" height="720px" width="720px" id="Ae8312044afacbb4b0acaa74dac88b1b10e1c"/>                     <use href="#E084-lcbipt" x="829" y="540" height="720px" width="720px" id="A83c65b12a1414b42a4c9941d5189c7a520d2"/>                  </g>                  <g id="l3muux8" class="layer">                     <g id="bbox-l3muux8" class="layer bounding-box"/>                     <g id="Ab6b5b0a3a8b9bb48fac81e4daa720fb206e6" class="note">                        <g id="bbox-Ab6b5b0a3a8b9bb48fac81e4daa720fb206e6" class="bounding-box bbnote">                           <rect x="1422" y="270" height="180" width="212" fill="transparent" id="A0ede8657aeda9b42e9c8ad6dab986366ff66"/>                        </g>                        <g class="notehead" id="A7be854c3aa901b4bc5cb307d4b7a45bb8c63">                           <use href="#E0A3-lcbipt" x="1422" y="360" height="720px" width="720px" id="A517b0a8ba652cb44d4cb69ed0bfb7ffd24cc"/>                        </g>                        <g id="s3w33vg" class="stem">                           <g id="bbox-s3w33vg" class="bounding-box bbstem">                              <rect x="1422" y="390" height="570" width="18" fill="transparent" id="A29947debabc8db40b1c8142d01b7b1760bdb"/>                           </g>                           <rect x="1422" y="390" height="570" width="18" id="A952b3523abea5b4406cb09dd13174fd45db9"/>                        </g>                     </g>                     <g id="Aa2b0ab24a4e45b4299cad84dd4d4c092d7ad" class="note">                        <g id="bbox-Aa2b0ab24a4e45b4299cad84dd4d4c092d7ad" class="bounding-box bbnote">                           <rect x="2472" y="630" height="180" width="212" fill="transparent" id="Ae08989deab897b47bdcb600d1a68ade17987"/>                        </g>                        <g class="notehead" id="A5152a53fa7de0b4cd4c8b24d6ea00b15c2a4">                           <use href="#E0A3-lcbipt" x="2472" y="720" height="720px" width="720px" id="A2214ee95a1646b4d43ca52dd4e5d4686e4ca"/>                        </g>                        <g id="sqrqram" class="stem">                           <g id="bbox-sqrqram" class="bounding-box bbstem">                              <rect x="2666" y="90" height="600" width="18" fill="transparent" id="A30d1802aae0d1b4d5dcb10bd57cf8e627cf6"/>                           </g>                           <rect x="2666" y="90" height="600" width="18" id="A691d55e3a3ed3b4719c93bbd564b84932820"/>                        </g>                     </g>                  </g>               </g>               <g id="bbnvvrm" class="barLine">                  <g id="bbox-bbnvvrm" class="bounding-box bbbarLine">                     <rect x="3508" y="-14" height="747" width="27" fill="transparent" id="Ad21c6766a38edb43d4c91ead03065491258a"/>                  </g>                  <path d="M3522 720 L3522 0" stroke="currentColor" stroke-width="27" id="Aa09b6f5cab299b4d44ca02fdf8876e663a14"/>               </g>            </g>            <g id="s13by9g" class="systemElementEnd sn5yghw"/>         </g>         <g id="plnlgon" class="pageElementEnd sjokyv4">            <g id="bbox-plnlgon" class="pageElementEnd bounding-box"/>         </g>         <g id="phncxf3" class="pageElementEnd ml9wpbr">            <g id="bbox-phncxf3" class="pageElementEnd bounding-box"/>         </g>      </g>   </svg></svg>');
    
  //const v = await Canvg.from(ctx, './example.svg')

  // Start SVG rendering with animations and mouse handling.
  v.start()

  window.onbeforeunload = () => {
    v.stop()
  }
};
  
  async startUp() {
    
     console.log('inputfield9');
     //console.log(this.testSVG);
    //var width = $(window).width();
    //var height = $(window).height();
    /*var element = document.createElement('canvas');
    $(element)
       .attr('id', 'background')
       .text('unsupported browser')
       .width(width)
       .height(height)
       .appendTo('vseDesc');
*/
    //var context = element.getContext("2d");
    //var cvgString = "'"+ testSVG + "'"
    //const v = Canvg.fromString(context, cvgString);
  //const v = Canvg.fromString(this.contextTest, '<svg width="600" height="600"><text x="50" y="50">Hello World!</text></svg>');
  var s = new XMLSerializer();
var str = s.serializeToString(this.testSVG);
const withoutLineBreaks = str.replace(/[\r\n]/gm, '');
console.log(withoutLineBreaks);
  const v  = Canvg.fromString(this.contextTest, str);
 
  // Start SVG rendering with animations and mouse handling.
  v.start();

  window.onbeforeunload = () => {
    v.stop();
  }
};

async toPng(data) {
  const {
    width,
    height,
    svg
  } = data
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  const v = await Canvg.from(ctx, svg, preset)

  // Render only first frame, ignoring animations and mouse.
  await v.render()
  console.log("toPng 4")
console.log(v)

  const blob = await canvas.convertToBlob()
  console.log(blob)
  const pngUrl = URL.createObjectURL(blob)
  
  objectURL = window.URL.createObjectURL(blob);

  return pngUrl
};

toDataURL(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var reader = new FileReader();
    reader.onloadend = function() {
      callback(reader.result);
    }
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', url);
  xhr.responseType = 'blop';
  xhr.send();
  
 
  
};

  
   /**
     * Load obeservers for changes in the dom, so that parameters of the vse can be updated 
     */
    loadObservers(){
        var that = this
        // do all the important vse stuff, when vse is properly loaded and attached
        var domAttachObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                Array.from(mutation.addedNodes).forEach(an => {
                    var _a;
                    if (an.constructor.name.toLowerCase().includes("element")) {
                        var ae = an;
                        if (ae.closest(".vse-container") !== null) {
                            if (((_a = that.currentAttachedElement) === null || _a === void 0 ? void 0 : _a.id) != ae.closest(".vse-container").id) {
                                that.currentAttachedElement = ae.closest(".vse-container");
                                that.vseInstances.forEach(vi => {
                                    if(vi.container.id === that.currentAttachedElement.id && !that.usedIds.includes(that.currentAttachedElement.id)){
                                        if(vi.getCore() != undefined){
                                            if(vi.getCore().getCurrentMEI(true) != undefined){
                                                that.usedIds.push(that.currentAttachedElement.id)
                                                that.currentAttachedElement.dispatchEvent(new Event("containerAttached"));
                                                that.configureVSE(vi)
                                                that.testSVG = document.getElementById('rootSVG'); 
                                                //that.start();
                                                console.log(that.testSVG);
                                                 //window.onload = function () {
        console.log('Dokument geladen');
        console.log('window.onload 1');
        //const canvas = document.querySelector('canvas');
        //const ctx = canvas.getContext('2d');
        
        var s = new XMLSerializer();
        var str = s.serializeToString(that.testSVG);
        const withoutLineBreaks = str.replaceAll('inherit', 'visible'); //TODO: komplette Ausdruck
        //console.log(withoutLineBreaks);
        //const v  = Canvg.fromString(ctx, withoutLineBreaks);
        
       // const v = Canvg.fromString(ctx, '<svg version="1.1" viewBox="0 0 3120 2040" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="red" />   <circle cx="150" cy="100" r="80" fill="green" />    <text x="150" y="125" font-size="60" text-anchor="middle" fill="white">SVG</text>    <defs><symbol id="E050-inl8cd" viewBox="0 0 1000 1000" overflow="visible"><path transform="scale(1,-1)" d="M364 -252c-245 0 -364 165 -364 339c0 202 153 345 297 464c12 10 11 12 9 24c-7 41 -14 106 -14 164c0 104 24 229 98 311c20 22 51 48 65 48c11 0 37 -28 52 -50c41 -60 65 -146 65 -233c0 -153 -82 -280 -190 -381c-6 -6 -8 -7 -6 -19l25 -145c3 -18 3 -18 29 -18 c147 0 241 -113 241 -241c0 -113 -67 -198 -168 -238c-14 -6 -15 -5 -13 -17c11 -62 29 -157 29 -214c0 -170 -130 -200 -197 -200c-151 0 -190 98 -190 163c0 62 40 115 107 115c61 0 96 -47 96 -102c0 -58 -36 -85 -67 -94c-23 -7 -32 -10 -32 -17c0 -13 26 -29 80 -29 c59 0 159 18 159 166c0 47 -15 134 -27 201c-2 12 -4 11 -15 9c-20 -4 -46 -6 -69 -6zM80 20c0 -139 113 -236 288 -236c20 0 40 2 56 5c15 3 16 3 14 14l-50 298c-2 11 -4 12 -20 8c-61 -17 -100 -60 -100 -117c0 -46 30 -89 72 -107c7 -3 15 -6 15 -13 c0 -6 -4 -11 -12 -11c-7 0 -19 3 -27 6c-68 23 -115 87 -115 177c0 85 57 164 145 194c18 6 18 5 15 24l-21 128c-2 11 -4 12 -14 4c-47 -38 -93 -75 -153 -142c-83 -94 -93 -173 -93 -232zM470 943c-61 0 -133 -96 -133 -252c0 -32 2 -66 6 -92c2 -13 6 -14 13 -8 c79 69 174 159 174 270c0 55 -27 82 -60 82zM441 117c-12 1 -13 -2 -11 -14l49 -285c2 -12 4 -12 16 -6c56 28 94 79 94 142c0 88 -67 156 -148 163z"></path></symbol></defs>   <g class="page-margin" transform="translate(500, 1000)" id="Ad4a3dc66a17f5b449ac9d78d0b978965aba3">           <g id="sin8efy" class="system">      <g id="mvzx9wd" class="measure" n="1"><g id="bbox-mvzx9wd" class="measure bounding-box"></g><g id="sy54csz" class="staff" n="1">                        <path d="M0 0 L2125 0" stroke="currentColor" stroke-width="13" id="A7ff42ef8a171eb459dc9f7ad590d223ef103" class="staffLine ClefG f5"></path><path d="M0 180 L2125 180" stroke="currentColor" stroke-width="13" id="A8cb44ed3a2ebcb425ecb0f3d39770d55a662" class="staffLine ClefG d5"></path><path d="M0 360 L2125 360" stroke="currentColor" stroke-width="13" id="Ad78bafdfa3187b4f7ec947ad0d36721537ed" class="staffLine ClefG b4"></path><path d="M0 540 L2125 540" stroke="currentColor" stroke-width="13" id="A7f270661a3269b4087cb0d2d39de5ebbf9b3" class="staffLine ClefG g4"></path><path d="M0 720 L2125 720" stroke="currentColor" stroke-width="13" id="Ab07cc496a1f16b4083c94e1dbb966a382fc3" class="staffLine ClefG e4"></path><g id="ck7oyfm" class="clef"><g id="bbox-ck7oyfm" class="bounding-box bbclef"><rect x="90" y="-251" height="1264" width="483" fill="transparent" id="A61cddd97a9cf8b42decb761d6c894cc88bd9"></rect></g><use href="#E050-inl8cd" x="90" y="540" height="720px" width="720px" id="A67a56de2a405db49c2cb237de6c68d56e14a"></use></g>                      </g>                   </g>                </g>           </g></svg>');
 //const v = Canvg.fromString(ctx, '<svg id="rootSVG" viewBox="0 0 654 303.171875" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:mei="http://www.music-encoding.org/ns/mei" overflow="visible" preserveAspectRatio="xMidYMid meet">   <desc>Engraved by Verovio 3.6.0-e61210e</desc>   <defs>      <symbol id="E050-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M364 -252c-245 0 -364 165 -364 339c0 202 153 345 297 464c12 10 11 12 9 24c-7 41 -14 106 -14 164c0 104 24 229 98 311c20 22 51 48 65 48c11 0 37 -28 52 -50c41 -60 65 -146 65 -233c0 -153 -82 -280 -190 -381c-6 -6 -8 -7 -6 -19l25 -145c3 -18 3 -18 29 -18 c147 0 241 -113 241 -241c0 -113 -67 -198 -168 -238c-14 -6 -15 -5 -13 -17c11 -62 29 -157 29 -214c0 -170 -130 -200 -197 -200c-151 0 -190 98 -190 163c0 62 40 115 107 115c61 0 96 -47 96 -102c0 -58 -36 -85 -67 -94c-23 -7 -32 -10 -32 -17c0 -13 26 -29 80 -29 c59 0 159 18 159 166c0 47 -15 134 -27 201c-2 12 -4 11 -15 9c-20 -4 -46 -6 -69 -6zM80 20c0 -139 113 -236 288 -236c20 0 40 2 56 5c15 3 16 3 14 14l-50 298c-2 11 -4 12 -20 8c-61 -17 -100 -60 -100 -117c0 -46 30 -89 72 -107c7 -3 15 -6 15 -13 c0 -6 -4 -11 -12 -11c-7 0 -19 3 -27 6c-68 23 -115 87 -115 177c0 85 57 164 145 194c18 6 18 5 15 24l-21 128c-2 11 -4 12 -14 4c-47 -38 -93 -75 -153 -142c-83 -94 -93 -173 -93 -232zM470 943c-61 0 -133 -96 -133 -252c0 -32 2 -66 6 -92c2 -13 6 -14 13 -8 c79 69 174 159 174 270c0 55 -27 82 -60 82zM441 117c-12 1 -13 -2 -11 -14l49 -285c2 -12 4 -12 16 -6c56 28 94 79 94 142c0 88 -67 156 -148 163z"/>      </symbol>      <symbol id="E084-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M40 -112c-12 0 -20 7 -20 17c0 3 1 7 3 11c0 1 1 2 1 3l6 8c30 42 128 181 128 305c0 16 14 19 23 19c8 0 53 -2 71 -2s59 2 68 2c8 0 15 -6 15 -14c0 -2 -1 -3 -1 -5c-3 -11 -163 -238 -243 -306h135v84c0 12 5 18 9 23l95 115c6 7 11 9 20 9c11 0 12 -9 12 -17v-214h73 c11 0 15 -7 15 -19s-5 -19 -15 -19h-73v-59c0 -32 21 -38 31 -38s22 -6 22 -20s-10 -21 -20 -21h-213c-15 0 -19 11 -19 21s7 19 23 19c18 0 40 8 40 35v63h-186z"/>      </symbol>      <symbol id="E0A3-lcbipt" viewBox="0 0 1000 1000" overflow="visible">         <path transform="scale(1,-1)" d="M97 -125c-55 0 -97 30 -97 83c0 52 47 167 196 167c58 0 99 -32 99 -83c0 -33 -33 -167 -198 -167zM29 -44c0 -7 3 -14 6 -20c7 -12 19 -23 40 -23c48 0 189 88 189 131c0 7 -3 13 -6 19c-7 12 -18 21 -37 21c-47 0 -192 -79 -192 -128z"/>      </symbol>   </defs>   <style type="text/css">g.page-margin{font-family:Times;} g.ending, g.reh, g.tempo{font-weight:bold;} g.dir, g.dynam, g.mNum{font-style:italic;} g.label{font-weight:normal;}</style>   <svg class="definition-scale" color="black" viewBox="0 0 4530 2100">      <g class="page-margin" transform="translate(500, 1000)" id="A590856a2aa7d9b41d7c9e03da542c75049a4">         <g id="ml9wpbr" class="mdiv pageElementStart">            <g id="bbox-ml9wpbr" class="bounding-box bbmdiv"/>         </g>         <g id="sjokyv4" class="score pageElementStart">            <g id="bbox-sjokyv4" class="bounding-box bbscore"/>         </g>         <g id="sopo5mf" class="system">            <g id="bbox-sopo5mf" class="system bounding-box"/>            <g id="sn5yghw" class="section systemElementStart"/>            <g id="mtc9dz4" class="measure">               <g id="bbox-mtc9dz4" class="measure bounding-box"/>               <g id="sdl36yz" class="staff">                  <g id="bbox-sdl36yz" class="bounding-box bbstaff">                     <rect x="-7" y="-7" height="733" width="3548" fill="transparent" id="A26fe29c0a19afb434ecbb90ddf4da89f213a"/>                  </g>                  <path d="M0 0 L3535 0" stroke="currentColor" stroke-width="13" id="A417fa8baa9637b422ccaa04d8863e0f897d9"/>                  <path d="M0 180 L3535 180" stroke="currentColor" stroke-width="13" id="A5e363970aa24eb4fe4c8632d6173ea8191c2"/>                  <path d="M0 360 L3535 360" stroke="currentColor" stroke-width="13" id="A7f15f3abaed2ab4cb9c9872d87abca192e89"/>                  <path d="M0 540 L3535 540" stroke="currentColor" stroke-width="13" id="A8de8123ba5fe0b47a0cbeb1d4d229940e5ce"/>                  <path d="M0 720 L3535 720" stroke="currentColor" stroke-width="13" id="Ac19f4f0ca6ee1b4159cba0fd38945c8b283b"/>                  <g id="c39omrw" class="clef">                     <g id="bbox-c39omrw" class="bounding-box bbclef">                        <rect x="90" y="-251" height="1264" width="483" fill="transparent" id="A4e67e88eaf6ebb4d49c92d8d5b26d0079eb9"/>                     </g>                     <use href="#E050-lcbipt" x="90" y="540" height="720px" width="720px" id="Adccdc5eba3228b4675cbc33d3394c9e67780"/>                  </g>                  <g id="mtl66dx" class="meterSig">                     <g id="bbox-mtl66dx" class="bounding-box bbmeterSig">                        <rect x="843" y="0" height="720" width="309" fill="transparent" id="A1e60a647a166fb4a93ca305d3ed0feb343f6"/>                     </g>                     <use href="#E084-lcbipt" x="829" y="180" height="720px" width="720px" id="Ae8312044afacbb4b0acaa74dac88b1b10e1c"/>                     <use href="#E084-lcbipt" x="829" y="540" height="720px" width="720px" id="A83c65b12a1414b42a4c9941d5189c7a520d2"/>                  </g>                  <g id="l3muux8" class="layer">                     <g id="bbox-l3muux8" class="layer bounding-box"/>                     <g id="Ab6b5b0a3a8b9bb48fac81e4daa720fb206e6" class="note">                        <g id="bbox-Ab6b5b0a3a8b9bb48fac81e4daa720fb206e6" class="bounding-box bbnote">                           <rect x="1422" y="270" height="180" width="212" fill="transparent" id="A0ede8657aeda9b42e9c8ad6dab986366ff66"/>                        </g>                        <g class="notehead" id="A7be854c3aa901b4bc5cb307d4b7a45bb8c63">                           <use href="#E0A3-lcbipt" x="1422" y="360" height="720px" width="720px" id="A517b0a8ba652cb44d4cb69ed0bfb7ffd24cc"/>                        </g>                        <g id="s3w33vg" class="stem">                           <g id="bbox-s3w33vg" class="bounding-box bbstem">                              <rect x="1422" y="390" height="570" width="18" fill="transparent" id="A29947debabc8db40b1c8142d01b7b1760bdb"/>                           </g>                           <rect x="1422" y="390" height="570" width="18" id="A952b3523abea5b4406cb09dd13174fd45db9"/>                        </g>                     </g>                     <g id="Aa2b0ab24a4e45b4299cad84dd4d4c092d7ad" class="note">                        <g id="bbox-Aa2b0ab24a4e45b4299cad84dd4d4c092d7ad" class="bounding-box bbnote">                           <rect x="2472" y="630" height="180" width="212" fill="transparent" id="Ae08989deab897b47bdcb600d1a68ade17987"/>                        </g>                        <g class="notehead" id="A5152a53fa7de0b4cd4c8b24d6ea00b15c2a4">                           <use href="#E0A3-lcbipt" x="2472" y="720" height="720px" width="720px" id="A2214ee95a1646b4d43ca52dd4e5d4686e4ca"/>                        </g>                        <g id="sqrqram" class="stem">                           <g id="bbox-sqrqram" class="bounding-box bbstem">                              <rect x="2666" y="90" height="600" width="18" fill="transparent" id="A30d1802aae0d1b4d5dcb10bd57cf8e627cf6"/>                           </g>                           <rect x="2666" y="90" height="600" width="18" id="A691d55e3a3ed3b4719c93bbd564b84932820"/>                        </g>                     </g>                  </g>               </g>               <g id="bbnvvrm" class="barLine">                  <g id="bbox-bbnvvrm" class="bounding-box bbbarLine">                     <rect x="3508" y="-14" height="747" width="27" fill="transparent" id="Ad21c6766a38edb43d4c91ead03065491258a"/>                  </g>                  <path d="M3522 720 L3522 0" stroke="currentColor" stroke-width="27" id="Aa09b6f5cab299b4d44ca02fdf8876e663a14"/>               </g>            </g>            <g id="s13by9g" class="systemElementEnd sn5yghw"/>         </g>         <g id="plnlgon" class="pageElementEnd sjokyv4">            <g id="bbox-plnlgon" class="pageElementEnd bounding-box"/>         </g>         <g id="phncxf3" class="pageElementEnd ml9wpbr">            <g id="bbox-phncxf3" class="pageElementEnd bounding-box"/>         </g>      </g>   </svg></svg>');
    
        // Start SVG rendering with animations and mouse handling.
       // v.start();
        
        that.toPng({
  width: 600,
  height: 600,
  svg: withoutLineBreaks
}).then((pngUrl) => {
  const img = document.querySelector('img')

  img.src = pngUrl
  console.log("jetzt konvertieren img.src");
  console.log(img.src);
  
  
  /*that.toDataURL(img.src, function(dataUrl) {
    console.log('RESULT:', dataUrl)
})*/
  
});


        
        
   // }
                         
                                            }
                                        }
                                    }
                                })
                            }
                        }
                    }
                });
            });
        });

        domAttachObserver.observe(document, {
            childList: true,
            subtree: true
        });

        // reload the size of the svg in current slide, since the viewbox is initally 0 0 0 0
        var currentSlideObserver = new MutationObserver(function (mutations){
        console.log('mutations');
            mutations.forEach(function(mutation){
            console.log('mutation.attributeName');
            console.log(mutation.attributeName);
               if(mutation.attributeName === "class"){
                   var target = mutation.target
                   if(target.classList.contains("h5p-question-content")){
                    console.log('h5p-question-content 1');
                       var vseContainer = target.querySelector(".vse-container")
                       if(vseContainer === null) return
                        that.vseInstances.forEach(vi => {
                            if(vi.container.id === vseContainer.id){
                                var core = vi.getCore()
                                core.setStyleOptions({".system": {"transform": ["scale(2.5)"]}}) // todo: make scale more responsive
                                //core.setHideUX(true)
                                core.loadData("", core.getCurrentMEI(false), false, "svg_output")
                            }
                        })
                   }
               }
            })
        })

        document.querySelectorAll(".h5p-sc-slide").forEach(q => {
            currentSlideObserver.observe(q, {
                attributes: true
            })
        })
        
      
    };
  
  /**
     * Configure the vse parameters as given by the core interfacing methods
     * @param {*} vseInstance 
     */
    configureVSE(vseInstance){
        this.vseInstance = vseInstance
        var vseContainer = document.getElementById(vseInstance.container.id)
        // vseContainer.querySelectorAll("#sidebarContainer, #btnToolbar, #customToolbar, #interactionOverlay").forEach(tb => tb.style.setProperty("display" ,"none", "important"))
        var core = this.vseInstance.getCore()
        var toolkit = core.getVerovioWrapper().getToolkit()
        console.log('configureVSE 8');
            console.log(vseContainer.getBoundingClientRect().hight);
        
        toolkit.setOptions({ // here we could set some options for verovio if needed
            //pageWidth: vseContainer.getBoundingClientRect().width,
            adjustPageWidth: 1,
            adjustPageHeight: 1
        })
        //core.setStyleOptions({".system": {"transform": ["scale(2)"]}}) // todo: make scale more responsive
        //core.setHideUX(true)
        core.loadData("", core.getCurrentMEI(false), false, "svg_output").then(() => {
            this.adjustFrameResponsive(vseContainer)
        })

    };
  
  /**
     * Adjust its contents when all content is loaded
     */
     adjustFrameResponsive(vseContainer){
       
        var defScale = vseContainer.querySelector("#rootSVG .definition-scale")
        var dsHeight
        var dsWidth
        if (defScale !== null){
            dsHeight = defScale.getBoundingClientRect().height / 11
            dsHeight = dsHeight.toString() + "rem"
           // console.log(dsHeight);
        }
        vseContainer.style.height = dsHeight || "20rem" 
        //console.log(vseContainer.style.height);
        
        var h5pContainer = document.querySelector(".h5p-container")
        var showChildren = h5pContainer.querySelectorAll(".h5p-sc-set > *, .h5p-actions, .vse-container, .h5p-sc")
        var h5pContainerHeight = 0
        showChildren.forEach(sc => {
            h5pContainerHeight += sc.getBoundingClientRect().height
            sc.style.position = "relative" // very important, so that the containers are displayed in the same column
        })
        //h5pContainer.style.height =  h5pContainerHeight.toString() + "px"
        //console.log(h5pContainerHeight.toString());
        window.frameElement.style.height =  vseContainer.style.height + "px"//h5pContainerHeight.toString() + "px"
    };
    
 
  /**
   * Get introduction for H5P.Question.
   * @return {Object} DOM elements for introduction.
   */
  getIntroduction(){
    return this.taskDescription;
  };

  /**
   * Get content for H5P.Question.
   * @return {Object} DOM elements for content.
   */
  getContent() {
    return this.content;
  };

  /**
   * Get current text in InputField.
   * @return {string} Current text.
   */
  getText() {
    return this.inputField.value;
  };

  /**
   * Disable the inputField.
   */
  disable() {
    this.inputField.disabled = true;
  };

  /**
   * Enable the inputField.
   */
  enable() {
    this.inputField.disabled = false;
  };

  /**
   * Enable the inputField.
   */
  focus() {
    this.inputField.focus();
  };

  /**
   * Set the text for the InputField.
   * @param {string|Object} previousState - Previous state that was saved.
   */
  setText(previousState) {
    if (typeof previousState === 'undefined') {
      return;
    }
    if (typeof previousState === 'string') {
      this.inputField.innerHTML = previousState;
    }
    if (typeof previousState === 'object' && !Array.isArray(previousState)) {
      this.inputField.innerHTML = previousState.inputField || '';
    }
  };

  /**
   * Compute the remaining number of characters.
   * @return {number} Number of characters left.
   */
  /*function computeRemainingChars() {
    return this.params.maximumLength - this.inputField.value.length;
  };*/

  /**
   * Update character message field.
   */
  updateMessageChars() {
    /*if (!this.params.statusBar) {
      return;
    }*/

    /*if (typeof this.params.maximumLength !== 'undefined') {
      this.setMessageChars(this.params.remainingChars.replace(/@chars/g, this.computeRemainingChars()), false);
    }
    else {
      // Use EMPTY_MESSAGE to keep height
      this.setMessageChars(EMPTY_MESSAGE, false);
    }*/
  };

  /**
   * Update the indicator message for saved text.
   * @param {string} saved - Message to indicate the text was saved.
   */
  updateMessageSaved(saved) {
   /* if (!this.params.statusBar) {
      return;
    }*/

    // Add/remove blending effect
    if (typeof saved === 'undefined' || saved === '') {
      this.statusSaved.classList.remove(ANIMATION_MESSAGE);
      //this.statusSaved.removeAttribute('tabindex');
    }
    else {
      this.statusSaved.classList.add(ANIMATION_MESSAGE);
      //this.statusSaved.setAttribute('tabindex', 0);
    }
    this.statusSaved.innerHTML = saved;
  };

  /**
   * Set the text for the character message.
   * @param {string} message - Message text.
   * @param {boolean} important - If true, message will added a particular CSS class.
   */
  setMessageChars(message, important) {
    /*if (!this.params.statusBar) {
      return;
    }*/

    if (typeof message !== 'string') {
      return;
    }

    if (message === EMPTY_MESSAGE || important) {
      /*
       * Important messages should be read for a readspeaker by caller and need
       * not be accessible when tabbing back again.
       */
      this.statusChars.removeAttribute('tabindex');
    }
    else {
      this.statusChars.setAttribute('tabindex', 0);
    }

    this.statusChars.innerHTML = message;
    if (important) {
      this.statusChars.classList.add(CHAR_MESSAGE_IMPORTANT);
    }
    else {
      this.statusChars.classList.remove(CHAR_MESSAGE_IMPORTANT);
    }
  };

}