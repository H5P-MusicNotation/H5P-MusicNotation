import VerovioScoreEditor from "verovioscoreeditor";
import {
  jQuery as $, JoubelUI as UI, Question
}
  from "./globals";
import NoteInputField from "./noteinputfield";
import TextInputField from "./textinputfield";
import { uuidv4 } from "verovioscoreeditor/src/scripts/js/utils/random";

/**
 * TODO: This content type needs refactoring.
 */
const AnalysisScore4LMS = (function () {

  /**
   * @constructor
   * @extends Question
   */

  // CSS Classes
  const SOLUTION_CONTAINER = 'h5p-analysis-solution-container';
  const SOLUTION_TITLE = 'h5p-analysis-solution-title';

  // The H5P feedback right now only expects true (green)/false (red) feedback, not neutral feedback
  const FEEDBACK_EMPTY = '<span class="h5p-analysis-feedback-empty">...</span>';

  /**
   * @constructor
   * @param {Object} config - Config from semantics.json.
   * @param {string} contentId - ContentId.
   * @param {Object} [contentData] - contentData.
   */
  function AnalysisScore4LMS(config, contentId, contentData) {
    // Initialize
    if (!config) {
      return;
    }

    console.log("CONFIG", config)

    // Inheritance
    Question.call(this, 'analysis');

    // Sanitize defaults
    this.params = AnalysisScore4LMS.extend(
      {
        media: {},
        taskDescription: '',
        checkAnswer: 'Submit',
        behaviour: { enableRetry: true },
      },
      config);
    this.contentId = contentId;
    this.extras = contentData;
    const defaultLanguage = (this.extras && this.extras.metadata) ? this.extras.metadata.defaultLanguage || 'en' : 'en';
    this.languageTag = AnalysisScore4LMS.formatLanguageCode(defaultLanguage);

    this.score = 0;
    this.internalShowSolutionsCall = false;

    this.modelSolution = config.interactiveNotation // is string
    this.taskType = config.selectTaskType // will be important how the different evaluations will be implemeneted

    // Sanitize HTML encoding
    //this.params.placeholderText = this.htmlDecode(this.params.placeholderText || '');

    // Get previous state from content data
    if (contentData != undefined && contentData?.previousState != undefined){
      if(Object.keys(contentData.previousState).length > 0) {
        this.previousState = contentData.previousState;
      }
    }

    this.isAnswered = this.previousState && this.previousState.inputField && this.previousState.inputField !== '' || false;
    this.ignoreScoring = this.params.behaviour?.ignoreScoring || this.taskType === "analysisText"

    this.deltaTempMap = new Map()

  };

  // Extends Question
  AnalysisScore4LMS.prototype = Object.create(Question.prototype);
  AnalysisScore4LMS.prototype.constructor = AnalysisScore4LMS;

  function sanitizeXMLString(xml) {
    return xml?.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, "\"");
  }

  function reformatXMLString(xml) {
    return xml?.replace("&", "&amp;")
      .replace(">", "&gt;")
      .replace("<", "&lt;")
      .replace("\"", "&quot;")
      .replace(/\n/g, "") // delete all unnecessary newline
      .replace(/\s{2,}/g, ""); // delete all unnecessary whitespaces
  }

  /**
   * Zoom SVG since it is not interactive anymore after loading from task editor
   * @param {*} e 
   */
  AnalysisScore4LMS.prototype.zoomSvg = function (e) {
    var t = e.target

    var vseContainer = t.closest(".vse-container")
    if (!this.deltaTempMap.has(vseContainer.id)) {
      this.deltaTempMap.set(vseContainer.id, 1.0)
    }

    var deltaTemp = this.deltaTempMap.get(vseContainer.id)

    if (t.classList.contains("zoomIn")) {
      deltaTemp = deltaTemp + 200 / 1000
    } else if (t.classList.contains("zoomOut")) {
      deltaTemp = deltaTemp - 200 / 1000
    }

    this.deltaTempMap.set(vseContainer.id, deltaTemp)

    vseContainer.querySelectorAll("svg").forEach(svg => {
      svg.setAttribute("transform", "scale(" + deltaTemp.toString() + ")")
      svg.style.transform = "scale(" + deltaTemp.toString() + ")"
    })
  }

  /**
   * Register the DOM elements with H5P.Question.
   */
  AnalysisScore4LMS.prototype.registerDomElements = function () {
    const that = this;

    // Create InputFields

    var viewScore = this.taskType === "noInteract" ? undefined : reformatXMLString(this.previousState?.inputField) || this.params.as4lControllerGroup?.dataStorageGroup?.viewScore
    var annotField = sanitizeXMLString(this.params.as4lControllerGroup?.dataStorageGroup?.annotationField)
    if (viewScore != undefined) {
      this.noteInputField = new NoteInputField({
        notationScore: viewScore,
        previousState: this.previousState,
        annotationField: annotField
        //statusBar: statusBar
      }, {
        onInteracted: (function (params) {
          that.handleInteracted(params);
        }),
        onInput: (function () {
          that.handleInput();
        })
      });



      if (this.params.selectTaskType === "analysisText") {
        this.noteInputField?.disableInteraction()
        this.textInputField = new TextInputField({
          // TODO: Params für inputfield übernehmen
        }
          , {
            onInteracted: (function (params) {
              that.handleInteracted(params);
            }),
            onInput: (function () {
              that.handleInput();
            })
          });
      }
    }

    this.setViewState(this.previousState && this.previousState.viewState || 'task');
    if (this.viewState === 'results') {
      // Need to wait until DOM is ready for us
      H5P.externalDispatcher.on('initialized', function () {
        that.handleCheckAnswer({ skipXAPI: true });
      });
    }
    else if (this.viewState === 'solutions') {
      // Need to wait until DOM is ready for us
      H5P.externalDispatcher.on('initialized', function () {
        that.handleCheckAnswer({ skipXAPI: true });
        that.showSolutions();
        // We need the retry button if the mastering score has not been reached or scoring is irrelevant
        if (that.getScore() < that.getMaxScore() || that.ignoreScoring || that.getMaxScore() === 0) {
          if (that.params.behaviour.enableRetry) {
            that.showButton('try-again');
          }
        }
        else {
          that.hideButton('try-again');
        }
      });
    }

    // Register content
    if (this.noteInputField != undefined) {
      this.content = this.noteInputField?.getContent();
    } else {
      this.content = document.createElement("div")
    }

    if (this.textInputField != undefined) {
      this.content.appendChild(this.textInputField.getContent())
    }

    // description paragraphs
    var parser = new DOMParser()
    this.params.paragraphs?.reverse().forEach(d => {

      var newDiv = document.createElement("div")
      newDiv.setAttribute("id", d.subContentId)
      newDiv.classList.add("description-container")
      var mediaList = d.mediaList

      mediaList?.forEach(ml => {
        var media = ml

        if (media && media.type && media.type.library) {
          var mediaType = media.type;
          var type = mediaType.library.split(' ')[0];
          if (type === 'H5P.Image') {
            if (mediaType.params.file) {
              // Register task image
              newDiv.appendChild(
                this.getImageElement(mediaType.params.file.path, {
                  disableImageZooming: media.disableImageZooming || false,
                  alt: mediaType.params.alt,
                  title: mediaType.params.title
                })
              )
            }
          }
          else if (type === 'H5P.Video') {
            if (mediaType.params.sources) {
              //this.setVideo(mediaType)
              newDiv.appendChild(this.getVideoElement(mediaType))
            }
          }
          else if (type === 'H5P.Audio') {
            if (mediaType.params.files) {
              // Register task audio
              newDiv.appendChild(this.getAudioElement(mediaType))
            }
          }
        }
      })


      d.notations?.forEach(n => {
        if(n.constructor.name === "Object"){
          n = n.notationWidget
        }
        if(n == undefined){
          throw new TypeError("Please check the object. Only xml valid strings can be displyed", n)
        }
        var svgout = parser.parseFromString(sanitizeXMLString(n), "text/html").body.firstChild
        svgout.classList.add("vse-container")
        svgout.setAttribute("id", uuidv4())
        svgout.querySelectorAll("#manipulatorCanvas, #scoreRects, #labelCanvas, #phantomCanvas").forEach(c => c.remove())
        svgout.setAttribute("height", "200px")

        var zoomBtnContainer = document.createElement("div")
        zoomBtnContainer.classList.add("zoomBtnContainer")
        svgout.append(zoomBtnContainer)


        var zoomInButton = document.createElement("button")
        zoomInButton.classList.add("h5p-zoomBtn", "zoomIn")
        zoomInButton.addEventListener("click", this.zoomSvg.bind(this))
        zoomBtnContainer.append(zoomInButton)

        var zoomOutButton = document.createElement("button")
        zoomOutButton.classList.add("h5p-zoomBtn", "zoomOut")
        zoomOutButton.addEventListener("click", this.zoomSvg.bind(this))
        zoomBtnContainer.append(zoomOutButton)


        newDiv.prepend(svgout)
      })
      if(d.paragraphText.length > 0){
        newDiv.prepend(parser.parseFromString(d.paragraphText, "text/html").body.firstChild)
      }
      this.content.prepend(newDiv)
    })


    this.setContent(this.content);

    // Register Buttons
    if(this.taskType !== "noInteract"){
      this.addButtons(this.content);
    }
  };


  /**
   * Create an Audio Element through H5P Audio Instance which will be inserted into this.content
   * Audio will only be displayed in full Player
   * @param {*} params 
   * @returns 
   */
  AnalysisScore4LMS.prototype.getAudioElement = function (params) {
    params.params = params.params || {};

    // player should be always full. Only then the Audio appears in one DOMElement
    params.params.playerMode = "full"

    var sections = {}
    var audioId = "audio-" + uuidv4()
    sections.audio = {
      $element: $('<div/>', {
        'class': 'h5p-question-audio',
        'id': audioId
      })
    };

    params.params.autoplay = false;
    sections.audio.instance = H5P.newRunnable(params, this.contentId, sections.audio.$element, true);

    var audioElement = sections.audio.$element[0] //new DOMParser().parseFromString(sections['audio'].$element[0].outerHTML, 'text/html').body.children[0]
    if (params.metadata != undefined) {
      if (params.metadata?.title !== "" && params.metadata?.title.toLowerCase() !== "untitled audio") {
        var titleElement = document.createElement("div")
        titleElement.textContent = params.metadata?.title
        audioElement.prepend(titleElement)
      }
    }

    return audioElement
  }

  AnalysisScore4LMS.prototype.getImageElement = function (path, options) {
    var that = this
    options = options ? options : {};
    // Image container
    var sections = { image: {} }
    sections.image.$element = $('<div/>', {
      'class': 'h5p-question-image h5p-question-image-fill-width',
      "id": "image-" + uuidv4()
    });

    // Inner wrap
    var $imgWrap = $('<div/>', {
      'class': 'h5p-question-image-wrap',
      appendTo: sections.image.$element
    });

    // Image element
    var $img = $('<img/>', {
      src: H5P.getPath(path, this.contentId),
      alt: (options.alt === undefined ? '' : options.alt),
      title: (options.title === undefined ? '' : options.title),
      on: {
        load: function () {
          that.trigger('imageLoaded', this);
          that.trigger('resize');
        }
      },
      appendTo: $imgWrap
    });

    return sections.image.$element[0]
  };


  AnalysisScore4LMS.prototype.getVideoElement = function (params) {
    var that = this
    var sections = {}
    sections.video = {
      $element: $('<div/>', {
        'class': 'h5p-question-video',
        'id': "video-" + uuidv4()
      })
    };

    params.params.playback.autoplay = false;

    // Never fit to wrapper
    if (!params.params.visuals) {
      params.params.visuals = {};
    }
    params.params.visuals.fit = false;
    sections.video.instance = H5P.newRunnable(params, this.contentId, sections.video.$element, true);
    var fromVideo = false; // Hack to avoid never ending loop
    sections.video.instance.on('resize', function () {
      fromVideo = true;
      that.trigger('resize');
      fromVideo = false;
    });
    that.on('resize', function () {
      if (!fromVideo) {
        sections.video.instance.trigger('resize');
      }
    });

    var videoElement = sections.video.$element[0]
    if (params.metadata?.title !== "" && params.metadata?.title.toLowerCase() !== "untitled video") {
      var titleElement = document.createElement("div")
      titleElement.textContent = params.metadata?.title
      videoElement.prepend(titleElement)
    }

    return videoElement;
  }


  /**
   * Add all the buttons that shall be passed to H5P.Question.
   */
  AnalysisScore4LMS.prototype.addButtons = function () {
    const that = this;

    // Show solution button
    that.addButton('show-solution', that.params.showSolution, function () {
      // Not using a parameter for showSolutions to not mess with possibe future contract changes
      that.internalShowSolutionsCall = true;
      that.showSolutions();
      that.internalShowSolutionsCall = false;
    }, false, {
      'aria-label': this.params.ariaShowSolution
    }, {});

    // Check answer button
    that.addButton('check-answer', that.params.checkAnswer, function () {
      that.handleCheckAnswer();
    }, that.params.behaviour?.enableCheckButton, {
      'aria-label': this.params.ariaCheck
    }, {
      contentData: this.extras,
      textIfSubmitting: this.params.submitAnswer,
    });

    // Retry button
    that.addButton('try-again', that.params.tryAgain, function () {
      that.resetTask({ skipClear: true });
    }, false, {
      'aria-label': this.params.ariaRetry
    }, {});

  };

  /**
   * Handle the evaluation.
   * @param {object} [params = {}] Parameters.
   * @param {boolean} [params.skipXAPI = false] If true, don't trigger xAPI.
   */
  AnalysisScore4LMS.prototype.handleCheckAnswer = function (params) {
    const that = this;

    params = AnalysisScore4LMS.extend({
      skipXAPI: false
    }, params);

    // Show message if the minimum number of characters has not been met
    // if (that.noteinputField?.getText().length < that.params.behaviour.minimumLength) {
    //   const message = that.params.notEnoughChars.replace(/@chars/g, that.params.behaviour.minimumLength);
    //   that.noteinputField?.setMessageChars(message, true);
    //   that.read(message);
    //   return;
    // }

    that.setViewState('results');

    that.noteinputField?.disable();
    /*
     * Only set true on "check". Result computation may take some time if
     * there are many keywords due to the fuzzy match checking, so it's not
     * a good idea to do this while typing.
     */
    that.isAnswered = true;
    that.handleEvaluation(params);

    /* if (that.params.behaviour.enableSolutionsButton === true) {
       that.showButton('show-solution');
     }*/
    //that.hideButton('check-answer');
  };

  /**
   * Get the user input from DOM.
   * @param {string} [linebreakReplacement=' '] Replacement for line breaks.
   * @return {string} Cleaned input.
   */
  AnalysisScore4LMS.prototype.getInput = function (linebreakReplacement) {
    linebreakReplacement = linebreakReplacement || ' ';

    let userText = '';
    if (this.noteInputField) {
      userText = this.noteInputField?.getText();
    }
    else if (this.previousState && this.previousState.inputField) {
      userText = this.previousState.inputField;
    }

    return userText
      .replace(/(\r\n|\r|\n)/g, linebreakReplacement)
      .replace(/\s\s/g, ' ');
  };

  /**
   * Handle user interacted.
   * @param {object} params Parameters.
   * @param {boolean} [params.updateScore] If true, will trigger score computation.
   */
  AnalysisScore4LMS.prototype.handleInteracted = function (params) {
    params = params || {};


    // Deliberately keeping the state once answered
    this.isAnswered = this.isAnswered || this.noteInputField?.getText().length > 0 || this.textInputField.getText().length > 0
    /*if (params.updateScore) {
      // Only triggered when explicitly requested due to potential complexity
      this.updateScore();
    }*/

    this.triggerXAPI('interacted');
  };

  /**
   * Check if AnalysisScore4LMS has been submitted/minimum length met.
   * @return {boolean} True, if answer was given.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
   */
  AnalysisScore4LMS.prototype.getAnswerGiven = function () {
    return this.isAnswered;
  };

  /**
   * Get latest score.
   * @return {number} latest score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
   */
  AnalysisScore4LMS.prototype.getScore = function () {
    // Return value is rounded because reporting module for moodle's H5P plugin expects integers
    return Math.round(this.score);
  };

  /**
   * Get maximum possible score.
   * @return {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  AnalysisScore4LMS.prototype.getMaxScore = function () {
    // Return value is rounded because reporting module for moodle's H5P plugin expects integers
    return (this.ignoreScoring) ? null : this.params.behaviour?.pointsHost || Math.round(this.scoreMastering) || 100
  };

  /**
   * Show solution.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
   */
  AnalysisScore4LMS.prototype.showSolutions = function () {
    // TODO: show differences in different score instances

    this.setViewState('solutions');
    this.noteInputField?.disable();

    // Insert solution after explanations or content.
    const predecessor = this.content.parentNode;

    //if ((typeof this.params.solution?.sample != undefined && this.params.solution.sample !== '') || this.taskType === "analysisText") {
    if (this.taskType === "analysisText") {
      // We add the sample solution here to make cheating at least a little more difficult
      if (this.solution.getElementsByClassName(SOLUTION_SAMPLE)[0].children.length === 0) {
        const text = document.createElement('div');
        text.classList.add(SOLUTION_SAMPLE_TEXT);
        text.innerHTML = this.params.solution.sample;
        this.solution.getElementsByClassName(SOLUTION_SAMPLE)[0].appendChild(text);
      }

      predecessor.parentNode.insertBefore(this.solution, predecessor.nextSibling);

      // Useful for accessibility, but seems to jump to wrong position on some Safari versions
      this.solutionAnnouncer.focus();
    } else if (this.modelSolution != undefined) {
      this.noteSolution = this.buildNoteSolution()
      predecessor.parentNode.insertBefore(this.noteSolution, predecessor.nextSibling);
      var modelParams = {
        notationScore: this.modelSolution,
        container: [...this.noteSolution.children].reverse()[0],
        isContent: false
      }
      this.modelVSEField = new NoteInputField(modelParams)
      this.modelVSEField.disableInteraction()
      this.noteInputField?.disableInteraction()
    }

    this.hideButton('show-solution');
    this.hideButton('check-answer')

    // Handle calls from the outside
    if (!this.internalShowSolutionsCall) {
      //this.hideButton('check-answer');
      this.hideButton('try-again');
    } else {
      this.showButton('try-again');
    }

    this.trigger('resize');
  };

  /**
   * Reset task.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  AnalysisScore4LMS.prototype.resetTask = function () {
    this.setViewState('task');

    this.setExplanation();
    this.removeFeedback();
    this.hideSolution();

    this.hideButton('show-solution');
    this.hideButton('try-again');

    // QuestionSet can control check button despite not in Question Type contract
    //if (this.params.behaviour.enableCheckButton) {
    this.showButton('check-answer');
    //}

    this.noteInputField?.enableInteraction();
    this.noteInputField?.focus();
    this.textInputField?.enableInteraction()

    this.isAnswered = false;
  };

  /**
   * Get xAPI data.
   * @return {Object} xAPI statement.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  AnalysisScore4LMS.prototype.getXAPIData = function () {
    return {
      statement: this.getXAPIAnswerEvent().data.statement
    };
  };

  /**
   * Determine whether the task has been passed by the user.
   * @return {boolean} True if user passed or task is not scored.
   */
  AnalysisScore4LMS.prototype.isPassed = function () {
    return (this.ignoreScoring || this.getScore() >= this.scorePassing);
  };

  /**
   * Update score.
   * @param {object} results Results.
   */
  AnalysisScore4LMS.prototype.updateScore = function (results) {
    results = results || this.computeResults();
    this.score = Math.min(this.computeScore(results), this.getMaxScore());
  };

  /**
   * Handle the evaluation.
   * @param {object} [params = {}] Parameters.
   * @param {boolean} [params.skipXAPI = false] If true, don't trigger xAPI.
   */
  AnalysisScore4LMS.prototype.handleEvaluation = function (params) {
    params = AnalysisScore4LMS.extend({
      skipXAPI: false
    }, params);
    this.computeResults();

    if (this.wrong != undefined && this.correct != undefined) {

      this.noteInputField?.getScoreContainer().querySelectorAll(".wrong")?.forEach(m => m.classList.remove("wrong"))
      this.wrong.forEach(w => {
        this.noteInputField?.getScoreContainer().querySelector("#" + w)?.classList.add("wrong")
      })
      this.correct.forEach(c => {
        this.noteInputField?.getScoreContainer().querySelector("#" + c)?.classList.add("correct")
      })

      console.log("SCORE", this.getScore())
      console.log("MAX SCORE", this.getMaxScore())

      // Not all keyword groups might be necessary for mastering
      // this.updateScore(results);
      // const textScore = H5P.Question
      //   .determineOverallFeedback(this.params.overallFeedback, this.getScore() / this.getMaxScore())
      //   .replace('@score', this.getScore())
      //   .replace('@total', this.getMaxScore());

      // if (!this.ignoreScoring && this.getMaxScore() > 0) {
      //   const ariaMessage = (this.params.ariaYourResult)
      //     .replace('@score', ':num')
      //     .replace('@total', ':total');
      //   this.setFeedback(textScore, this.getScore(), this.getMaxScore(), ariaMessage);
      // }
    } else { // For text explanations a result is not generated
      // Build explanations
      const explanations = this.buildTextExplanation(results);

      // Show explanations
      if (explanations.length > 0) {
        this.setExplanation(explanations, this.params?.feedbackHeader);
      }
    }

    // Show and hide buttons as necessary
    this.handleButtons(this.getScore());

    if (!params.skipXAPI) {
      // Trigger xAPI statements as necessary
      this.handleXAPI();
    }

    this.trigger('resize');

  };

  /**
   * Build solution DOM object. 
   * Show model solution and answer mei. 
   * @return {Object} DOM object.
   */
  AnalysisScore4LMS.prototype.buildNoteSolution = function () {
    var that = this
    const solution = document.createElement('div');
    solution.classList.add(SOLUTION_CONTAINER);

    this.solutionAnnouncer = document.createElement('div');
    this.solutionAnnouncer.setAttribute('tabindex', '0');
    //this.solutionAnnouncer.setAttribute('aria-label', this.params.ariaNavigatedToSolution);
    this.solutionAnnouncer.addEventListener('focus', function (event) {
      // Just temporary tabbable element. Will be announced by readspaker.
      event.target.blur();
      event.target.setAttribute('tabindex', '-1');
    });
    solution.appendChild(this.solutionAnnouncer);

    const solutionTitle = document.createElement('div');
    solutionTitle.classList.add(SOLUTION_TITLE);
    solutionTitle.innerHTML = "Solution" //this.params.solutionTitle;
    solution.appendChild(solutionTitle);

    // const solutionIntroduction = document.createElement('div');
    // solutionIntroduction.classList.add(SOLUTION_INTRODUCTION);
    // solutionIntroduction.innerHTML = this.params.solution.introduction;
    // solution.appendChild(solutionIntroduction);

    // const solutionSample = document.createElement('div');
    // solutionSample.classList.add(SOLUTION_SAMPLE);
    // solution.appendChild(solutionSample);

    if (this.taskType !== "analysisText") {
      // make container for the model solution
      const modelSolutionContainer = document.createElement("div")
      modelSolutionContainer.classList.add("vse-model-solution")
      modelSolutionContainer.setAttribute("id", "modelSolution-" + uuidv4())
      solution.appendChild(modelSolutionContainer)
    }

    return solution;
  };

  /**
   * Hide the solution.
   */
  AnalysisScore4LMS.prototype.hideSolution = function () {
    this.modelVSEField?.destroyVSEInstance()
    this.modelVSEField = null
    this.solution?.parentNode?.removeChild(this.solution);
    this.noteSolution?.parentNode?.removeChild(this.noteSolution);
  };

  /**
   * Compute results. Compare output according to tasktype
   * @returns results als Map<number, string>. Number: arbitrary counting id; string: id element that is wrong
   */
  AnalysisScore4LMS.prototype.computeResults = function () {
    switch (this.taskType) {
      case "noInteraction":
        break;
      case "harmLabels":
        this.evaluateHarmLabels()
        break;
      case "chords":
        this.evaluateChords()
        break;
      case "score":
        this.compareMEIplain()
        break;
      case "analysisText":
        break;
    }
  };

  /**
   * Evaluate series of harmony setting activities.
   * THe xAPI Evaluation is modelled as interactionType "matching"
   */
  AnalysisScore4LMS.prototype.evaluateHarmLabels = function () {
    var modelHarms = this.makeDoc(this.modelSolution).querySelectorAll("harm")
    var answerHarms = this.noteInputField?.getMei(true).querySelectorAll("harm")

    this.source = []
    this.dummySource = [] //dummyTource is needed to display given wrong answers in Task Evaluation. CorrectResponsesPattern MUST NOT contain these indizes
    this.response = ""
    this.correctResponsePattern = ""
    
    this.wrong = new Array()
    this.correct = new Array()
    var idxCounter = 0
    this.score = 0
    modelHarms.forEach((mh, i) => {
      this.source.push(mh.textContent)
      var hLabels = mh.textContent.replace(" ", "").split(",")
      this.correctResponsePattern = this.correctResponsePattern + "[,]" + i + "[.]" + i
      var hasNoMistake = hLabels.some(hl => hl === answerHarms[i].textContent.replace(" ", ""))
      if (hasNoMistake) {
        this.response = this.response + "[,]" + i + "[.]" + i
        this.correct.push(answerHarms[i].id)
        this.score += 1
      } else {
        this.response = this.response + "[,]" + i + "[.]" + (modelHarms.length + idxCounter).toString()
        this.dummySource.push(answerHarms[i].textContent)
        this.wrong.push(answerHarms[i].id)
        idxCounter += 1
      }
    })
    
    this.target = this.source
    this.response = this.response.substring(3) // delete trailing [,]
    this.correctResponsePattern = this.correctResponsePattern.substring(3)
    this.score = this.score / modelHarms.length * this.getMaxScore()
  }

  /**
   * 
   */
  AnalysisScore4LMS.prototype.evaluateChords = function () {

    var modelDoc = this.makeDoc(this.modelSolution)
    var modelHarms = modelDoc.querySelectorAll("harm")
    var answerDoc = this.noteInputField?.getMei(true)
    var answerHarms = answerDoc.querySelectorAll("harm")

    var that = this
    /**
     * create a set from all notes on the same timestamp. 
     * @param {*} harm element provides startid as id of the linkes element
     * @param {*} doc doc in which the harm and corrosponding notes are located
     * @returns 
     */
    function getNoteMaps(harm, doc) {
      var notes = doc.querySelector("#" + harm.getAttribute("startid"))
      var noteIdMap = new Map()
      var noteMap = new Map()
      var tstampNote = that.noteinputField?.getTstamp(notes)
      var measureN = notes.closest("measure").getAttribute("n")
      if (notes.tagName === "chord") {
        notes = notes.querySelectorAll("note")
      }
      notes = Array.from(notes)

      var noteId = 0
      var allDurs = doc.querySelectorAll('measure[n="' + measureN + '"] *[dur]')
      for (var i = 0; i < allDurs.length; i++) {
        var d = allDurs[i]
        if (notes.some(n => n.id === d.id)) return
        var tstampTemp = that.noteinputField?.getTstamp(d)
        if (tstampTemp === tstampNote) {
          if (d.tagName === "chord") {
            noteId += 10

            var subNoteId = noteId + 1
            d.querySelectorAll("note").forEach(n => {
              //notes.push(n)
              noteIdMap.set(subNoteId, n.id)
              subNoteId += 1
            })
          } else {
            //notes.push(d)
            noteIdMap.set(noteId, d.id)
            noteId += 10
          }
          break;
        }
      }

      var noteIds = [...noteIdMap.keys()]
      var set = new Array()
      notes.forEach((n, i) => {
        var accid = n.getAttribute("accid") || n.getAttribute("accid.ges") || "n"
        var pname = n.getAttribute("pname") + accid
        set.push(pname)
        noteMap.set(noteIds[i], pname)
      })

      return { noteMap: noteMap, noteIdMap: noteIdMap, pitchSet: [...new Set(set)] }
    }

    function joinResponse(array){
      array = array.map(rt => {
        let t = rt.replace("n", "")
        t = t.replace("s", "#")
        if(rt[1] === "f"){
          t = t.substring(0,1) + "b"
        }
        return t
      })
      return array.sort().join(",")
    }

    this.source = []
    this.target = []
    this.dummySource = []
    this.response = ""
    this.correctResponsePattern = ""

    this.wrong = new Array()
    this.correct = new Array()
    this.score = 0
    var idxCounter = 0
    modelHarms.forEach((mh, i) => {
      var modelNotes = getNoteMaps(mh, modelDoc)
      var modelNoteSet = modelNotes.pitchSet.sort()
      this.target.push(mh.textContent)
      this.source.push(joinResponse(modelNoteSet)) 
      this.correctResponsePattern += "[,]" + i + "[.]" + i
      var ah = answerHarms[i]
      var answerNotes = getNoteMaps(ah, answerDoc)
      var answerNoteMap = answerNotes.noteMap
      var answerNoteIdMap = answerNotes.noteIdMap

      var responseTemp = []

      var idsTemp = new Array()
      var pnameTemp = new Array()
      for (const [key, value] of answerNoteMap.entries()) {
        if (modelNoteSet.some(pname => pname === value)) { // in this case the pitchclass is present and is therefore correct
          pnameTemp.push(value) // track pnames that where already found. multiple notes won't be found in set, so this can be used to filter for found ids afterwards
          modelNoteSet = modelNoteSet.filter(x => x !== value)
          responseTemp.push(value)
          idsTemp.push(answerNoteIdMap.get(key))
          this.correct.push(answerNoteIdMap.get(key))
          answerNoteMap.delete(key)
        } else { // otherwise
          if (!pnameTemp.some(pname => pname === value)) {
            this.wrong.push(answerNoteIdMap.get(key))
            responseTemp.push(value)
          } else {
            this.correct.push(answerNoteIdMap.get(key))
            responseTemp.push(value)
            idsTemp.push(answerNoteIdMap.get(key))
          }
        }
      }
      if (modelNoteSet.length > 0) { // if modelNoteSet has still entries, there must be some pitch classes missing in the answer. Therefore the whole chord is cconsidered to be wrong
        this.wrong.concat(idsTemp)
      }
      

      if(answerNoteMap.size > 0 || modelNoteSet.length > 0){
        this.dummySource.push(joinResponse(responseTemp))
        this.response += "[,]" + i + "[.]" + (modelHarms.length + idxCounter).toString()
        idxCounter += 1
      }else{
        this.response += "[,]" + i + "[.]" + i
      }

      this.score += answerNoteMap.size === 0 && modelNoteSet.length === 0
    })


    this.response = this.response.substring(3) // delete trailing [,]
    this.correctResponsePattern = this.correctResponsePattern.substring(3)
    this.score = this.score / modelHarms.length * this.getMaxScore()

  }

  /**
   * Prepare files and send them to mei garage MusicDiff webservice. Only suitable for simple score comparison.
   */
  AnalysisScore4LMS.prototype.compareMEIService = function () {
    //1. combine mei data
    //TODO: All Tags under def-Tags (scoreDef, staffDef, etc.) must be included as attributes in corrospondig def-Tag
    var meiCorpus = document.implementation.createDocument('http://www.music-encoding.org/ns/mei', 'meiCorpus')
    var model = this.makeDoc(this.modelSolution)
    var answer = this.noteInputField?.getMei(true)
    meiCorpus.firstChild.appendChild(model.querySelector("mei"))
    meiCorpus.firstChild.appendChild(answer.querySelector("mei"))
    var combination = new XMLSerializer().serializeToString(meiCorpus).replace(/\ id/gi, " xml:id");

    return new Promise((resolve) => {
      var url = "https://meigarage.edirom.de/ege-webservice/Conversions/mei40Corpus%3Atext%3Axml/mei40Diff%3Atext%3Axml/"
      var form = new FormData()
      var blob = new Blob([combination], { type: "text/xml" })
      form.append('fileToConvert', blob, 'comparison.xml')
      fetch(url, {
        method: "POST",
        headers: {
          //"content-type": "text/xml; charset=UTF-8"
        },
        body: form
      }).then(response => {
        if (response.status !== 200) {
          console.log('something went wrong')
          console.log(response)
          throw Error(response.status)
        }
        return response.text()
      }).then(mei => {
        resolve(mei)
      }).catch(error => {
        console.log('received error: ')
        console.log(error)
        resolve()
      })

    })
  }

  /**
   * Plain comparison of MEI based on exact note inputs
   */
  AnalysisScore4LMS.prototype.compareMEIplain = function () {

  }

  /**
    * Clean mei for DOMParser
    * @param mei 
    * @returns 
    */
  AnalysisScore4LMS.prototype.cleanMEI = function (mei) {
    mei = mei.replace(/\xml:id/gi, "id"); // xml:id attribute will cause parser error
    mei = mei.replace(/\n/g, ""); // delete all unnecessary newline
    mei = mei.replace(/\s{2,}/g, ""); // delete all unnecessary whitespaces
    mei = mei.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, "\"");
    mei = mei.replace(/\xmlns=\"\"/g, "").replace(/\xmlns\s/g, "")
    return mei;
  }

  /**
    * Restore id to xml:id tags so that same ids will be used in verovio again
    * @param xmlDoc 
    * @returns 
    */
  AnalysisScore4LMS.prototype.restoreXmlIdTags = function (xmlDoc, parse = true) {
    var mei = new XMLSerializer().serializeToString(xmlDoc).replace(/\ id/gi, " xml:id");
    if (parse) {
      return new DOMParser().parseFromString(mei, "text/xml");
    }
    return mei
  }

  AnalysisScore4LMS.prototype.makeDoc = function (mei) {
    return new DOMParser().parseFromString(this.cleanMEI(mei), "application/xml")
  }


  /**
   * Compute the score for the results.
   * @param {Object[]} results - Results from the task.
   * @return {number} Score.
   */
  AnalysisScore4LMS.prototype.computeScore = function (results) {
    let score = 0;
    /* this.params.keywords.forEach(function (keyword, i) {
       score += Math.min(results[i].length, keyword.options.occurrences) * keyword.options.points;
     });*/
    return this.score;
  };

  /**
   * Build the explanations for H5P.Question.setExplanation.
   * @param {Object} results - Results from the task.
   * @return {Object[]} Explanations for H5P.Question.
   */
  AnalysisScore4LMS.prototype.buildTextExplanation = function (results) {
    const explanations = [];

    let word;
    this.params.keywords.forEach(function (keyword, i) {
      word = FEEDBACK_EMPTY;
      // Keyword was not found and feedback is provided for this case
      if (results[i].length === 0 && keyword.options.feedbackMissed) {
        if (keyword.options.feedbackMissedWord === 'keyword') {
          // Main keyword defined
          word = keyword.keyword;
        }
        explanations.push({ correct: word, text: keyword.options.feedbackMissed });
      }

      // Keyword found and feedback is provided for this case
      if (results[i].length > 0 && keyword.options.feedbackIncluded) {
        // Set word in front of feedback
        switch (keyword.options.feedbackIncludedWord) {
          case 'keyword':
            // Main keyword defined
            word = keyword.keyword;
            break;
          case 'alternative':
            // Alternative that was found
            word = results[i][0].keyword;
            break;
          case 'answer':
            // Answer matching an alternative at the learner typed it
            word = results[i][0].match;
            break;
        }
        explanations.push({ correct: word, text: keyword.options.feedbackIncluded });
      }
    });

    if (explanations.length > 0) {
      // Sort "included" before "not included", but keep order otherwise
      explanations.sort(function (a, b) {
        return a.correct === FEEDBACK_EMPTY && b.correct !== FEEDBACK_EMPTY;
      });
    }
    return explanations;
  };

  /**
   * Handle buttons' visibility.
   * @param {number} score - Score the user received.
   */
  AnalysisScore4LMS.prototype.handleButtons = function (score) {
    //if (this.params.solution.sample && !this.solution) {
    this.showButton('show-solution');
    //}

    // We need the retry button if the mastering score has not been reached or scoring is irrelevant
    // if (this.score < this.getMaxScore() || this.ignoreScoring || this.getMaxScore() === 0) {
    //   if (this.params.behaviour.enableRetry) {
    //     this.showButton('try-again');
    //   }
    // }
    // else {
    //   this.hideButton('try-again');
    // }

    this.hideButton('try-again');
  };

  /**
   * Handle xAPI event triggering
   * @param {number} score - Score the user received.
   */
  AnalysisScore4LMS.prototype.handleXAPI = function () {
    this.trigger(this.getXAPIAnswerEvent());

    // Additional xAPI verbs that might be useful for making analytics easier
    this.trigger(this.createAnalysisXAPIEvent('passed'));
    if (!this.ignoreScoring && this.getMaxScore() > 0) {
      if (this.getScore() < this.scorePassing) {
        this.trigger(this.createAnalysisXAPIEvent('failed'));
      }
      else {
        this.trigger(this.createAnalysisXAPIEvent('passed'));
      }
      if (this.getScore() >= this.getMaxScore()) {
        this.trigger(this.createAnalysisXAPIEvent('mastered'));
      }
    }
  };

  /**
   * Create an xAPI event for AnalysisScore4LMS.
   * @param {string} verb - Short id of the verb we want to trigger.
   * @return {H5P.XAPIEvent} Event template.
   */
  AnalysisScore4LMS.prototype.createAnalysisXAPIEvent = function (verb) {
    const xAPIEvent = this.createXAPIEventTemplate(verb);
    AnalysisScore4LMS.extend(
      xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
      this.getxAPIDefinition());
    return xAPIEvent;
  };

  /**
   * Get the xAPI definition for the xAPI object.
   * return {Object} XAPI definition.
   */
  AnalysisScore4LMS.prototype.getxAPIDefinition = function () {
    var interactionType = ""
    switch (this.taskType) {
      case "noInteraction":
        interactionType = "long-fill-in"
        break;
      case "harmLabels":
        interactionType = "matching"
        break;
      case "chords":
        interactionType = "matching"
        break;
      case "score":
        interactionType = "long-fill-in"
        break;
      case "analysisText":
        interactionType = "long-fill-in"
        break;
    }

    const definition = {};
      definition.name = {};
      definition.name[this.languageTag] = this.getTitle();
      // Fallback for h5p-php-reporting, expects en-US
      definition.name['en-US'] = definition.name[this.languageTag];
      // The H5P reporting module expects the "blanks" to be added to the description
      definition.description = {}
      definition.description[this.languageTag] = this.params.taskDescription + AnalysisScore4LMS.FILL_IN_PLACEHOLDER;
      // Fallback for h5p-php-reporting, expects en-US
      definition.description['en-US'] = definition.description[this.languageTag];
      definition.type = "http://adlnet.gov/expapi/activities/cmi.interaction"
      definition.interactionType = interactionType;
    
    switch (interactionType){
      case "long-fill-in":
        break;
      case "matching":

        // var tempSource = this.source
        // var tempTarget = this.target
        // this.source = tempTarget
        // this.target = tempSource

        definition.correctResponsesPattern = [this.correctResponsePattern]
        definition.source = []
        definition.target = []

        //compute source and target separately since both can have different descriptions
        // WARNING: H5P only accepts numercial ids in xAPI Statement
        this.source.forEach((s, i) => {
          let x = {
            "id": i,
            "description":{
              "en-US": s + "\n"
            }
          }
          definition.source[i] = x 
        })
        this.target.forEach((t, i) => {
          let x = {
            "id": i,
            "description":{
              "en-US": t + "\n"
            }
          }
          definition.target[i] = x
        })
        //dummySource is needed to display wrong answers in Task Evaluation. CorrectResponsesPattern MUST NOT contain these indizes
        this.dummySource.forEach((d, i) => {
          let x = {
            "id": definition.source.length,
            "description":{
              "en-US": d + "\n"
            }
          }
          definition.source[definition.source.length] = x
        })
      
      break;

      default:
      throw new Error(interactionType, " is not a valid interactionType")
    }






    /*
     * The official xAPI documentation discourages to use a correct response
     * pattern it if the criteria for a question are complex and correct
     * responses cannot be exhaustively listed. They can't.
     */
    console.log('getxAPIDefinition');
    console.log(definition);

    return definition;
  };

  /**
   * Build xAPI answer event.
   * @return {H5P.XAPIEvent} xAPI answer event.
   */
  AnalysisScore4LMS.prototype.getXAPIAnswerEvent = function () {
    const xAPIEvent = this.createAnalysisXAPIEvent('answered');

    xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this, true, this.isPassed());

    xAPIEvent.data.statement.result.response = this.response//this.noteInputField?.getText();

    console.log('getXAPIAnswerEvent');
    console.log(xAPIEvent);
    console.log('**************************');
    return xAPIEvent;
  };

  /**
   * Detect exact matches of needle in haystack.
   * @param {string} needle - Word or phrase to find.
   * @param {string} haystack - Text to find the word or phrase in.
   * @return {Object[]} Results: [{'keyword': needle, 'match': needle, 'index': front + pos}*].
   */
  AnalysisScore4LMS.prototype.detectExactMatches = function (needle, haystack) {
    // Simply detect all exact matches and its positions in the haystack
    const result = [];
    let pos = -1;
    let front = 0;

    needle = needle
      .replace(/\*/, '') // Wildcards checked separately
      .replace(new RegExp(AnalysisScore4LMS.REGULAR_EXPRESSION_ASTERISK, 'g'), '*'); // Asterisk from regexp

    while (((pos = haystack.indexOf(needle))) !== -1 && needle !== '') {
      if (H5P.TextUtilities.isIsolated(needle, haystack)) {
        result.push({ 'keyword': needle, 'match': needle, 'index': front + pos });
      }
      front += pos + needle.length;
      haystack = haystack.substr(pos + needle.length);
    }
    return result;
  };

  /**
   * Detect wildcard matches of needle in haystack.
   * @param {string} needle - Word or phrase to find.
   * @param {string} haystack - Text to find the word or phrase in.
   * @param {boolean} caseSensitive - If true, alternative is case sensitive.
   * @return {Object[]} Results: [{'keyword': needle, 'match': needle, 'index': front + pos}*].
   */
  AnalysisScore4LMS.prototype.detectWildcardMatches = function (needle, haystack, caseSensitive) {
    if (needle.indexOf('*') === -1) {
      return [];
    }

    // Clean needle from successive wildcards
    needle = needle.replace(/[*]{2,}/g, '*');

    // Clean needle from regular expression characters, * needed for wildcard
    const regexpChars = ['\\', '.', '[', ']', '?', '+', '(', ')', '{', '}', '|', '!', '^', '-'];
    regexpChars.forEach(function (char) {
      needle = needle.split(char).join('\\' + char);
    });

    // We accept only characters for the wildcard
    const regexp = new RegExp(needle.replace(/\*/g, AnalysisScore4LMS.CHARS_WILDCARD + '+'), this.getRegExpModifiers(caseSensitive));
    const result = [];
    let match;
    while ((match = regexp.exec(haystack)) !== null) {
      if (H5P.TextUtilities.isIsolated(match[0], haystack, { 'index': match.index })) {
        result.push({ 'keyword': needle, 'match': match[0], 'index': match.index });
      }
    }
    return result;
  };

  /**
   * Detect fuzzy matches of needle in haystack.
   * @param {string} needle - Word or phrase to find.
   * @param {string} haystack - Text to find the word or phrase in.
   * @param {Object[]} Results.
   */
  AnalysisScore4LMS.prototype.detectFuzzyMatches = function (needle, haystack) {
    // Ideally, this should be the maximum number of allowed transformations for the Levenshtein disctance.
    const windowSize = 2;
    /*
     * We cannot simple split words because we're also looking for phrases.
     * If we were just looking for exact matches, we could use something smarter
     * such as the KMP algorithm. Because we're dealing with fuzzy matches, using
     * this intuitive exhaustive approach might be the best way to go.
     */
    const results = [];
    // Without looking at the surroundings we'd miss words that have additional or missing chars
    for (let size = -windowSize; size <= windowSize; size++) {
      for (let pos = 0; pos < haystack.length; pos++) {
        const straw = haystack.substr(pos, needle.length + size);
        if (H5P.TextUtilities.areSimilar(needle, straw) && H5P.TextUtilities.isIsolated(straw, haystack, { 'index': pos })) {
          // This will only add the match if it's not a duplicate that we found already in the proximity of pos
          if (!this.contains(results, pos)) {
            results.push({ 'keyword': needle, 'match': straw, 'index': pos });
          }
        }
      }
    }
    return results;
  };

  /**
   * Get all the matches found to a regular expression alternative.
   * @param {string[]} alternatives - Alternatives.
   * @param {string} inputTest - Original text by student.
   * @param {boolean} caseSensitive - If true, alternative is case sensitive.
   * @return {string[]} Matches by regular expressions.
   */
  AnalysisScore4LMS.prototype.getRegExpAlternatives = function (alternatives, inputTest, caseSensitive) {
    const that = this;

    return alternatives
      .filter(function (alternative) {
        return (alternative[0] === '/' && alternative[alternative.length - 1] === '/');
      })
      .map(function (alternative) {
        const regNeedle = new RegExp(alternative.slice(1, -1), that.getRegExpModifiers(caseSensitive));
        return inputTest.match(regNeedle);
      })
      .reduce(function (a, b) {
        return a.concat(b);
      }, [])
      .filter(function (item) {
        return item !== null;
      });
  };

  /**
   * Get modifiers for regular expressions.
   * @param {boolean} caseSensitive - If true, alternative is case sensitive.
   * @return {string} Modifiers for regular expressions.
   */
  AnalysisScore4LMS.prototype.getRegExpModifiers = function (caseSensitive) {
    const modifiers = ['g'];
    if (!caseSensitive) {
      modifiers.push('i');
    }

    return modifiers.join('');
  };

  /**
   * Merge the matches.
   * @param {...Object[]} matches - Detected matches.
   * @return {Object[]} Merged matches.
   */
  AnalysisScore4LMS.prototype.mergeMatches = function () {
    // Sanitization
    if (arguments.length === 0) {
      return [];
    }
    if (arguments.length === 1) {
      return arguments[0];
    }

    // Add all elements from args[1+] to args[0] if not already there close by.
    const results = (arguments[0] || []).slice();
    for (let i = 1; i < arguments.length; i++) {
      const match2 = arguments[i] || [];
      for (let j = 0; j < match2.length; j++) {
        if (!this.contains(results, match2[j].index)) {
          results.push(match2[j]);
        }
      }
    }
    return results.sort(function (a, b) {
      return a.index > b.index;
    });
  };

  /**
   * Check if an array of detected results contains the same match in the word's proximity.
   * Used to prevent double entries that can be caused by fuzzy matching.
   * @param {Object} results - Preliminary results.
   * @param {string} results.match - Match that was found before at a particular position.
   * @param {number} results.index - Starting position of the match.
   * @param {number} index - Index of solution to be checked for double entry.
   */
  AnalysisScore4LMS.prototype.contains = function (results, index) {
    return results.some(function (result) {
      return Math.abs(result.index - index) <= result.match.length;
    });
  };

  /**
   * Extend an array just like JQuery's extend.
   * @param {...Object} arguments - Objects to be merged.
   * @return {Object} Merged objects.
   */
  AnalysisScore4LMS.extend = function () {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (typeof arguments[0][key] === 'object' &&
            typeof arguments[i][key] === 'object') {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  };

  /**
   * Get task title.
   * @return {string} Title.
   */
  AnalysisScore4LMS.prototype.getTitle = function () {
    let raw;
    if (this.extras.metadata) {
      raw = this.extras.metadata.title;
    }
    raw = raw || AnalysisScore4LMS.DEFAULT_DESCRIPTION;

    // H5P Core function: createTitle
    return H5P.createTitle(raw);
  };

  /**
   * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
   * Cmp. https://tools.ietf.org/html/rfc5646
   * @param {string} languageTag Language tag.
   * @return {string} Formatted language tag.
   */
  AnalysisScore4LMS.formatLanguageCode = function (languageCode) {
    if (typeof languageCode !== 'string') {
      return languageCode;
    }

    /*
     * RFC 5646 states that language tags are case insensitive, but
     * recommendations may be followed to improve human interpretation
     */
    const segments = languageCode.split('-');
    segments[0] = segments[0].toLowerCase(); // ISO 639 recommendation
    if (segments.length > 1) {
      segments[1] = segments[1].toUpperCase(); // ISO 3166-1 recommendation
    }
    languageCode = segments.join('-');

    return languageCode;
  };

  /**
   * Retrieve true string from HTML encoded string
   * @param {string} input - Input string.
   * @return {string} Output string.
   */
  AnalysisScore4LMS.prototype.htmlDecode = function (input) {
    const dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent;
  };

  /**
   * Get current state for H5P.Question.
   * @return {Object} Current state.
   */
  AnalysisScore4LMS.prototype.getCurrentState = function () {
    // if (!this.noteInputField) {
    //   return; // may not be attached to the DOM yet
    // }

    // this.noteInputField?.updateMessageSaved(this.params.messageSave);

    return {
      inputField: this.noteInputField?.getMei(),
      viewState: this.viewState
    };
  };

  /**
   * Set view state.
   * @param {string} state View state.
   */
  AnalysisScore4LMS.prototype.setViewState = function (state) {
    if (AnalysisScore4LMS.VIEW_STATES.indexOf(state) === -1) {
      return;
    }

    this.viewState = state;
  };

  /** @constant {string}
   * latin special chars: \u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF
   * greek chars: \u0370-\u03FF
   * kyrillic chars: \u0400-\u04FF
   * hiragana + katakana: \u3040-\u30FF
   * common CJK characters: \u4E00-\u62FF\u6300-\u77FF\u7800-\u8CFF\u8D00-\u9FFF
   * thai chars: \u0E00-\u0E7F
   */
  AnalysisScore4LMS.CHARS_WILDCARD = '[A-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0370-\u03FF\u0400-\u04FF\u3040-\u309F\u3040-\u30FF\u4E00-\u62FF\u6300-\u77FF\u7800-\u8CFF\u8D00-\u9FFF\u0E00-\u0E7F]';

  /** @constant {string}
   * Required to be added to xAPI object description for H5P reporting
   */
  AnalysisScore4LMS.FILL_IN_PLACEHOLDER = '__________';

  /** @constant {string} */
  AnalysisScore4LMS.DEFAULT_DESCRIPTION = 'AnalysisScore4LMS';

  /** @constant {string} */
  AnalysisScore4LMS.REGULAR_EXPRESSION_ASTERISK = ':::H5P-AnalysisScore4LMS-REGEXP-ASTERISK:::';

  /** @constant {string[]} view state names*/
  AnalysisScore4LMS.VIEW_STATES = ['task', 'results', 'solutions'];

  return AnalysisScore4LMS;
})();

export default AnalysisScore4LMS;