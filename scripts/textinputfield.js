import {
  jQuery as $, JoubelUI as UI, Question
}
  from "./globals";


// CSS Classes
const MAIN_CONTAINER = 'h5p-analysis-text-input-field';
const INPUT_LABEL = 'h5p-analysis-text-input-field-label';
const INPUT_FIELD = 'h5p-analysis-text-input-field-textfield';
const WRAPPER_MESSAGE = 'h5p-analysis-text-input-field-message-wrapper';
const CHAR_MESSAGE = 'h5p-analysis-text-input-field-message-char';
const CHAR_MESSAGE_IMPORTANT = 'h5p-analysis-text-input-field-message-char-important';
const SAVE_MESSAGE = 'h5p-analysis-text-input-field-message-save';
const ANIMATION_MESSAGE = 'h5p-analysis-text-input-field-message-save-animation';
const EMPTY_MESSAGE = '&nbsp;';

export default class TextInputField {
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
    this.callbacks.onInteracted = this.callbacks.onInteracted || (function () { });


    var placeholderText = this.params.placeholderText || "Enter your analysis here..."
    // InputField
    this.inputField = document.createElement('textarea');
    this.inputField.classList.add(INPUT_FIELD);
    // this.inputField.setAttribute('rows', this.params.inputFieldSize);
    // this.inputField.setAttribute('maxlength', this.params.maximumLength);
    this.inputField.setAttribute('placeholder', placeholderText);
    this.setText(this.previousState);
    this.oldValue = this.previousState;

    this.containsText = this.oldValue.length > 0;

    // Interacted listener
    this.inputField.addEventListener('blur', function () {
      if (that.oldValue !== that.getText()) {
        that.callbacks.onInteracted({ updateScore: true });
      }

      that.oldValue = that.getText();
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
    });

    this.content = document.createElement('div');
    this.content.appendChild(this.inputField);

    // Container
    this.container = document.createElement('div');
    this.container.classList.add(MAIN_CONTAINER);
    this.container.appendChild(this.content);

    if (params.statusBar) {
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
    }
  };

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
    if (!this.params.statusBar) {
      return;
    }

    if (typeof this.params.maximumLength !== 'undefined') {
      this.setMessageChars(this.params.remainingChars.replace(/@chars/g, this.computeRemainingChars()), false);
    }
    else {
      // Use EMPTY_MESSAGE to keep height
      this.setMessageChars(EMPTY_MESSAGE, false);
    }
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