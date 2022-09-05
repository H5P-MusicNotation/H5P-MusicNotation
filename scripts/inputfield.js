import { Canvg, presets } from 'canvg';
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

export default class EssayinputField {
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
    console.log(params)
    var that = this;
    this.currentAttachedElement = undefined;
    this.usedIds = [];
    this.params = params;
    this.previousState = params.previousState || '';

    // Callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onInteracted = this.callbacks.onInteracted || (function () { });

    // Sanitization
    this.params.taskDescription = this.params.taskDescription || '';
    this.params.taskDescriptionScore = this.params.taskDescriptionScore || '';

    // Task description
    this.taskDescription = document.createElement('div');
    this.taskDescription.classList.add(INPUT_LABEL);
    this.taskDescription.innerHTML = this.params.taskDescription;

    this.vseInstances = [];


    // InputField
    this.inputField = document.createElement('textarea');
    this.inputField.classList.add(INPUT_FIELD);
    this.inputField.classList.add("essay-input")
    this.setText(this.previousState);
    this.oldValue = this.previousState;

    this.containsText = this.oldValue.length > 0;

    this.content = document.createElement('div');
    //* ************************************************* */
    this.content.appendChild(this.inputField);

    var scoreContainer = document.createElement('div');
    scoreContainer.setAttribute('id', 'vseDesc');
    var vse = new VerovioScoreEditor(scoreContainer, { data: this.previousState.inputField.length > 0 ? this.previousState.inputField : this.params.taskDescriptionScore });
    this.content.appendChild(scoreContainer);
    this.vseInstances.push(vse);

    var fullsizeBtn = document.createElement("button")
    fullsizeBtn.id = "fullscreenBtn_" + scoreContainer.id
    fullsizeBtn.classList.add("fullscreenBtn_")
    fullsizeBtn.textContent = "Fullscreen"
    this.inputField.parentElement.insertBefore(fullsizeBtn, this.inputField.parentElement.firstElementChild)

    parent.document.querySelectorAll("iframe").forEach(frame => {
      frame.setAttribute("allowfullscreen", "")
    })
    fullsizeBtn.addEventListener("click", this.setFullscreen.bind(this))
    //document.addEventListener("fullscreenerror", (evt) => console.log(evt))
    document.addEventListener("fullscreenchange", this.setFullscreenElements.bind(this))

    // Container
    this.container = document.createElement('div');
    this.container.classList.add(MAIN_CONTAINER);

    var elementSVG = document.createElement('img');
    this.content.appendChild(elementSVG);

    this.loadObservers()

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
    const blob = await canvas.convertToBlob()
    const pngUrl = URL.createObjectURL(blob)

    //var objectURL = window.URL.createObjectURL(blob);

    return pngUrl
  };

  async toDataURL(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var reader = new FileReader();
      console.log(url, callback)
      reader.onloadend = function () {
        callback(reader.result);
      }
      reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  };

  serializeSVG() {
    var s = new XMLSerializer();
    var str = s.serializeToString(this.rootSVG);
    const withoutLineBreaks = str.replaceAll('inherit', 'visible'); //TODO: komplette Ausdruck
    var that = this
    this.toPng({
      width: 600,
      height: 600,
      svg: withoutLineBreaks
    }).then((pngUrl) => {
      const img = that.rootSVG.closest(".vse-container").parentElement.querySelector('img')
      img.src = pngUrl
      img.classList.add("essay-input")
      that.toDataURL(img.src, function (dataUrl) {
        //console.log('Serilization complete:', dataUrl)
        that.setText("<img src=\"" + dataUrl + "\"/>")
      })
    });
  }

  /**
    * Load obeservers for changes in the dom, so that parameters of the vse can be updated 
    */
  loadObservers() {
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
                  if (vi.container.id === that.currentAttachedElement.id && !that.usedIds.includes(that.currentAttachedElement.id)) {
                    if (vi.getCore() != undefined) {
                      if (vi.getCore().getCurrentMEI(true) != undefined) {
                        that.usedIds.push(that.currentAttachedElement.id)
                        that.currentAttachedElement.dispatchEvent(new Event("containerAttached"));
                        that.vseInstance = vi
                        that.vseContainer = vi.container
                        // that.configureVSE(vi)
                        that.rootSVG = that.currentAttachedElement.querySelector('#rootSVG');
                        that.serializeSVG()
                        svgChangedbserver.observe(rootSVG, {
                          childList: true,
                          subtree: true
                        })
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

    var svgChangedbserver = new MutationObserver(function (mutations) {
      that.serializeSVG()
    })

    //reload the size of the svg in current slide, since the viewbox is initally 0 0 0 0
    var currentSlideObserver = new MutationObserver(function (mutations) {
      //console.log('mutations');
      mutations.forEach(function (mutation) {
        // console.log('mutation.attributeName');
        // console.log(mutation.attributeName);
        if (mutation.attributeName === "class") {
          var target = mutation.target
          if (target.classList.contains("h5p-question-content")) {
            //console.log('h5p-question-content 1');
            var vseContainer = target.querySelector(".vse-container")
            if (vseContainer === null) return
            that.vseInstances.forEach(vi => {
              if (vi.container.id === vseContainer.id) {
                var core = vi.getCore()
                //core.setStyleOptions({ ".system": { "transform": ["scale(2.5)"] } }) // todo: make scale more responsive
                //core.setHideUX(true)
                core.loadData("", core.getCurrentMEI(false), false, "svg_output")
              }
            })
          }
        }
      })
    })

    document.querySelectorAll(".h5p-question-content").forEach(q => {
      currentSlideObserver.observe(q, {
        attributes: true
      })
    })


  };

  /**
     * Configure the vse parameters as given by the core interfacing methods
     * @param {*} vseInstance 
     */
  configureVSE(vseInstance) {
    this.vseInstance = vseInstance
    this.vseContainer = document.getElementById(vseInstance.container.id)
    var core = this.vseInstance.getCore()
    var toolkit = core.getVerovioWrapper().getToolkit()

    toolkit.setOptions({ // here we could set some options for verovio if needed
      //pageWidth: vseContainer.getBoundingClientRect().width,
      //adjustPageWidth: 1,
      adjustPageHeight: 1
    })
    //core.setStyleOptions({ ".system": { "transform": ["scale(2)"] } }) // todo: make scale more responsive
    //core.setHideUX(true)
    core.loadData("", core.getCurrentMEI(false), false, "svg_output").then(() => {
      this.adjustFrameResponsive(this.vseContainer)
    })

  };

  /**
     * Adjust its contents when all content is loaded
     */
  adjustFrameResponsive(vseContainer) {

    var defScale = vseContainer.querySelector("#rootSVG .definition-scale")
    var dsHeight
    var dsWidth
    if (defScale !== null) {
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
    window.frameElement.style.height = vseContainer.style.height + "px"//h5pContainerHeight.toString() + "px"
  };

  setFullscreen(e) {
    if (document.fullscreenElement) {
      this.vseInstance.getCore().getVerovioWrapper().getToolkit().setOptions({
        adjustPageWidth: 1,
      })
      parent.document.exitFullscreen()
      var containerParent = this.vseContainer
      while (containerParent) {
        containerParent.classList.remove("fullscreen")
        containerParent = containerParent.parentElement
      }
    } else {
      var containerParent = this.vseContainer || this.vseInstance.container
      this.vseInstance.getCore().getVerovioWrapper().getToolkit().setOptions({
        adjustPageWidth: 0,
      })
      var userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.includes("apple") && !userAgent.includes("chrome")) {
        parent.document.webkitRequestFullscreen()
        while (containerParent) {
          containerParent.classList.add("fullscreen")
          containerParent = containerParent.parentElement
        }
      } else {
        console.log("containerparent", containerParent)
        containerParent.requestFullscreen()
        containerParent.classList.add("fullscreen")
      }
    }
  }

  setFullscreenElements(e) {
    var fullscreenBtn = this.vseContainer.querySelector(".fullscreenBtn")
    if (this.vseContainer.classList.contains("fullscreen")) {
      this.vseContainer.classList.remove("fullscreen")
      if (fullscreenBtn !== null) { fullscreenBtn.classList.remove("transparent") }
    } else {
      this.vseContainer.classList.add("fullscreen")
      if (fullscreenBtn !== null) { fullscreenBtn.classList.add("transparent") }
    }
  }

  getMei() {
    return this.vseInstance.getCore().getCurrentMEI(false)
  }


  /**
   * Get introduction for H5P.Question.
   * @return {Object} DOM elements for introduction.
   */
  getIntroduction() {
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