import {
  jQuery as $, JoubelUI as UI, Question, setUserData, getUserData
}
  from "./globals";
import NoteInputField from "./noteinputfield";
import { uuidv4 } from "vibe-editor/src/scripts/js/utils/random";
import * as sw from 'stopword';

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

    console.log("CONFIG", config, contentData)

    // get User Data, since in some instances contentData is not loading the state after saving it actively
    var userData
    function setUD(_, data) { userData = data }
    getUserData(contentId, 'state', setUD)

    // Inheritance
    Question.call(this, 'analysis');

    // Sanitize defaults
    this.params = AnalysisScore4LMS.extend(
      {
        media: {},
        taskDescription: '',
        behaviour: { enableRetry: false },
      },
      config);
    this.contentId = contentId;
    this.extras = AnalysisScore4LMS.extend(contentData);
    if (userData) {
      this.extras = AnalysisScore4LMS.extend(userData);
    }
    const defaultLanguage = (this.extras && this.extras.metadata) ? this.extras.metadata.defaultLanguage || 'en' : 'en';
    this.languageTag = AnalysisScore4LMS.formatLanguageCode(defaultLanguage);

    this.points = 0;

    this.solutionMEI = config.as4lControllerGroup.dataStorageGroup.solutionMEI  // is string
    this.studentMEI = config.as4lControllerGroup.dataStorageGroup.studentMEI //MEI for the initalization of VSE  //is string
    this.studentSVG = config.as4lControllerGroup.dataStorageGroup.studentSVG //SVG to be shown, when Tasks loads
    //this.annotationView = config.as4lControllerGroup.dataStorageGroup.annotationViewField

    this.checkPitch = config.taskConfig.checkPitch || false
    this.checkDuration = config.taskConfig.checkDuration || false
    this.checkOctavePosition = this.checkPitch ? config.taskConfig.checkOctavePosition || false : false
    this.checkHarmLabels = config.taskConfig.checkHarmLabels || false
    this.checkTextboxes = config.taskConfig.checkTextboxes || false
    this.noChecks = !this.checkOctave && !this.checkDuration && !this.checkHarmLabels && !this.checkPitch && !this.checkTextboxes

    this.checkShowSolutions = config.taskConfig.showSolution || false
    this.checkRetry = config.taskConfig.retry || false
    this.checkGrading = config.taskConfig.grading || false

    this.displayInteractiveNotation = config.selectInteractiveNotation === "interact"

    if (this.noChecks) {
      this.checkGrading = false
    }

    this.pointsPassing = config.taskConfig.passPercentage

    // Get previous state from content data
    if (contentData != undefined && contentData?.previousState != undefined) {
      if (Object.keys(contentData.previousState).length > 0) {
        this.previousState = contentData.previousState;
      }
    }
    if (this.previousState == undefined) {
      this.previousState = userData
    }

    this.isAnswered = this.previousState && this.previousState.inputField && this.previousState.inputField !== '' || false;
    this.ignoreScoring = this.params.behaviour?.ignoreScoring

    this.deltaTempMap = new Map()
    this.taskContainerHeight = 0 // height of the task container. Will only set once per Instance and shouldn't change after updating the 

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
    const t = e.target
    const vseContainer = t.closest(".vse-container")
    if (!this.deltaTempMap.has(vseContainer.id)) {
      this.deltaTempMap.set(vseContainer.id, 1.0)
    }

    var deltaTemp = this.deltaTempMap.get(vseContainer.id)
    const zoomFactor = 100 / 1000
    if (t.classList.contains("zoomIn")) {
      deltaTemp = deltaTemp + zoomFactor
    } else if (t.classList.contains("zoomOut")) {
      deltaTemp = deltaTemp - zoomFactor
    }

    this.deltaTempMap.set(vseContainer.id, deltaTemp)

    //vseContainer.style.width = (100 * deltaTemp).toString() + "%"

    vseContainer.querySelectorAll("svg, g").forEach(svg => {
      svg.style.width = (100 * deltaTemp).toString() + "%"
    })
  }

  /**
   * Register the DOM elements with H5P.Question.
   */
  AnalysisScore4LMS.prototype.registerDomElements = function () {
    const that = this;

    // Create InputFields 
    if (this.studentMEI) {
      this.noteInputField = new NoteInputField({
        notationScore: this.studentMEI,
        previousState: this.previousState,
        svgContainer: this.studentSVG,
        afterLoadCallback: (function () { // get sure that the mei is displayed and then proceed with hiding ui elements if necessary
          this.handleSubmitAnswer({ skipXAPI: true, vseInit: true })
          var vsecore = this.noteInputField.vseInstance.getCore()
          if (!(this.checkPitch || this.checkDuration) && this.checkHarmLabels) {
            vsecore.noteInputSwitch("off")
            vsecore.setHideUI(true)
            var options = { annotationCanvas: false, labelCanvas: false, canvasMusicPlayer: true, scoreRects: false, manipulatorCanvas: true, sidebarContainer: true, btnToolbar: true, customToolbar: true, groups: true }
            vsecore.setHideOptions(options)
            vsecore.hideUI(options)
          }
          var container = vsecore.getContainer()
          if (this.taskContainerHeight === 0) {
            Array.from(container.children).forEach(c => {
              if (c.id === "sidebarContainer") return
              this.taskContainerHeight += c.getBoundingClientRect().height
            })
          }
          container.style.height = this.taskContainerHeight * 3 + "px"
          //reset annotation Canvas to interact with it
          const svgAnnotCanvas = vsecore.getContainer().querySelector("#annotationCanvas")
          vsecore.getInsertModeHandler().getAnnotations().updateAnnotationList(svgAnnotCanvas);
          vsecore.getInsertModeHandler().getAnnotations().updateLinkedTexts()

        }).bind(this)
      },
        {
          onInteracted: (function (params) {
            that.handleInteracted(params);
          }),
          onInput: (function () {
            that.handleInput();
          })
        });
    }

    this.setViewState(this.previousState && this.previousState.viewState || 'task');
    if (this.viewState === 'results') {
      // Need to wait until DOM is ready for us
      H5P.externalDispatcher.on('initialized', function () {
        that.handleSubmitAnswer({ skipXAPI: true })
      });
    }
    else if (this.viewState === 'solutions') {
      // Need to wait until DOM is ready for us
      H5P.externalDispatcher.on('initialized', function () {
        that.handleSubmitAnswer({ skipXAPI: true });
        that.showSolutions();
        // We need the retry button if the mastering score has not been reached or scoring is irrelevant
        if (that.getScore() < that.getMaxScore() || that.ignoreScoring || that.getMaxScore() === 0) {
          if (that.checkRetry) {
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
        if (n.constructor.name === "Object") {
          n = n.notationWidget
        }
        if (n == undefined) {
          throw new TypeError("Please check the object. Only xml valid strings can be displyed", n)
        }
        var svgout = parser.parseFromString(sanitizeXMLString(n), "text/html").body.firstChild
        svgout.classList.add("vse-container")
        svgout.setAttribute("id", uuidv4())
        svgout.querySelectorAll("#manipulatorCanvas, #scoreRects, #labelCanvas, #phantomCanvas").forEach(c => c.remove())
        var vb = svgout.querySelector("#interactionOverlay").getAttribute("viewBox").split(" ").map(parseFloat)

        svgout.style.height = (vb[3] * 1.25).toString() + "px"
        svgout.style.width = "100%"

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
      if (d.paragraphText.length > 0) {
        newDiv.prepend(parser.parseFromString(d.paragraphText, "text/html").body.firstChild)
      }
      this.content.prepend(newDiv)
    })

    this.setContent(this.content);

    // Register Buttons
    if (this.displayInteractiveNotation) {
      this.addButtons();
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
    if (that.checkShowSolutions) {
      that.addButton('show-solution', that.params.showSolution, function () {
        // Not using a parameter for showSolutions to not mess with possibe future contract changes
        that.showSolutions();
      }, false, {
        'aria-label': this.params.ariaShowSolution
      }, {});
    }

    // Check answer button
    if (!this.noChecks) {
      var label = "Check"
      if (that.checkGrading) label = "Submit"
      that.addButton("check-answer", label, function () {
        that.handleSubmitAnswer();
      }, that.params.behaviour?.enableCheckButton, {
        'aria-label': this.params.ariaCheck
      }, {
        contentData: this.extras,
        textIfSubmitting: this.params.submitAnswer,
      });
    }

    // Will save the current state of the score
    that.addButton("save", "Save Progress", function () {
      that.handleSaveProgress()
      that.handleInteracted()
    }, that.params.behaviour?.enableCheckButton, {
      'aria-label': this.params.ariaCheck
    }, {
      contentData: this.extras,
      textIfSubmitting: this.params.submitAnswer,
    });
    that.showButton("save")


    // Retry button
    if (that.checkRetry) {
      that.addButton('try-again', "Retry", function () {
        that.resetTask({ skipClear: true });
      }, false, {
        'aria-label': this.params.ariaRetry
      }, {});
    }

  };

  /**
   * Handle the evaluation.
   * @param {object} [params = {}] Parameters.
   * @param {boolean} [params.skipXAPI = false] If true, don't trigger xAPI.
   */
  AnalysisScore4LMS.prototype.handleSubmitAnswer = function (params) {
    this.setViewState(this.previousState && this.previousState.viewState);
    if (!["results", "solution"].some(x => x === this.viewState) && params?.vseInit === true) return

    this.setViewState('results');

    this.noteInputField?.disable()
    if (this.checkGrading) {
      this.hideButton(this.submitButtonId);
    } else if (this.checkShowSolutions) {
      this.showButton("show-solution")
    }

    this.isAnswered = true;
    this.handleEvaluation(params);
    this.handleSaveProgress()
  };

  AnalysisScore4LMS.prototype.handleSaveProgress = function () {
    setUserData(this.contentId, "state", this.getCurrentState(), {})
    getUserData(this.contentId, 'state', console.log)
  }

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
    this.isAnswered = this.isAnswered
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
    return Math.round(this.points / this.source.length * 100);
  };

  /**
   * Get maximum possible score.
   * @return {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  AnalysisScore4LMS.prototype.getMaxScore = function () {
    // Return value is rounded because reporting module for moodle's H5P plugin expects integers
    return (this.checkGrading) ? 100 : null
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

    //if ((typeof this.params.solution?.sample != undefined && this.params.solution.sample !== '') || this.displayInteractiveNotation === "analysisText") {
    if (this.solutionMEI) {
      this.noteSolution = this.buildNoteSolution()
      predecessor.parentNode.insertBefore(this.noteSolution, predecessor.nextSibling);
      var modelParams = {
        notationScore: this.solutionMEI,
        container: [...this.noteSolution.children].reverse()[0],
        isContent: false
      }
      this.modelVSEField = new NoteInputField(modelParams)

      setTimeout(() => {
        this.modelVSEField.disableInteraction()
        this.noteInputField?.disableInteraction()
      }, 10)

    }

    this.hideButton('show-solution');
    this.hideButton("check-answer")

    if (!this.checkRetry) {
      this.hideButton('try-again');
    } else {
      this.showButton("try-again")
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


    this.showButton("check-answer");

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
    return (this.ignoreScoring || this.getScore() >= this.pointsPassing);
  };

  /**
   * Update score.
   * @param {object} results Results.
   */
  AnalysisScore4LMS.prototype.updateScore = function (results) {
    results = results || this.computeResults();
    this.points = Math.min(this.computeScore(results), this.getMaxScore());
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
    if (this.noteInputField.vseInstance.getCore() == undefined) return
    this.computeResults();

    if (this.wrong && this.correct) {

      this.noteInputField?.getScoreContainer().querySelectorAll(".wrong")?.forEach(m => m.classList.remove("wrong"))
      this.wrong.forEach(w => {
        this.noteInputField?.getScoreContainer().querySelector("#" + w)?.classList.add("wrong")
      })
      this.correct.forEach(c => {
        this.noteInputField?.getScoreContainer().querySelector("#" + c)?.classList.add("correct")
      })

      if (this.checkGrading) {
        console.log("SCORE", this.getScore())
        console.log("MAX SCORE", this.getMaxScore())

        //Feedback
        this.setFeedback("", this.getScore(), this.getMaxScore(), 'You got :num out of :total points',)
        if (this.checkShowSolutions) {
          this.showButton('show-solution');
        }
        if (this.checkRetry) {
          this.showButton("try-again")
        }
        this.hideButton("check-answer")
      }
      // }
    }

    if (this.checkGrading) {
      // Show and hide buttons as necessary
      this.handleButtons(this.getScore());

      if (!params.skipXAPI) {
        // Trigger xAPI statements as necessary
        this.handleXAPI();
      } else {
        this.handleInteracted()
      }
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

    if (this.displayInteractiveNotation !== "analysisText") {
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
    if (this.checkHarmLabels) this.evaluateHarmLabels()
    if (this.checkDuration) this.evaluateRhythm()
    if (this.checkPitch) this.evaluatePitch()
    if (this.checkTextboxes) this.evaluateTextboxes()
  };

  AnalysisScore4LMS.prototype.initScoringValues = function () {
    this.source = this.source || [] // yields names for the matching table to be displayed
    this.dummySource = this.dummySource || [] //dummySource is needed to display given wrong answers in Task Evaluation. CorrectResponsesPattern MUST NOT contain these indizes
    this.response = this.response || ""
    this.correctResponsePattern = this.correctResponsePattern || ""
    this.points = this.point || 0
    this.wrong = this.wrong || new Array()
    this.correct = this.correct || new Array()
  }

  AnalysisScore4LMS.prototype.summarizeScoringValues = function () {
    this.target = this.source
    this.response = this.response.startsWith("[,]") ? this.response.slice(3) : this.response; // delete trailing [,]
    this.correctResponsePattern = this.correctResponsePattern.startsWith("[,]") ? this.correctResponsePattern.slice(3) : this.correctResponsePattern; //this.correctResponsePattern.substring(3)
  }



  /**
   * Evaluate series of harmony setting activities.
   * THe xAPI Evaluation is modelled as interactionType "matching"
   */
  AnalysisScore4LMS.prototype.evaluateHarmLabels = function () {
    var modelHarms = this.makeDoc(this.solutionMEI).querySelectorAll("harm")
    var answerHarms = this.noteInputField?.getMei(true).querySelectorAll("harm")

    this.initScoringValues()

    this.wrong = new Array()
    this.correct = new Array()
    var idxCounter = 0
    modelHarms.forEach((mh, i) => {
      this.source.push(mh.textContent)
      this.correctResponsePattern = this.correctResponsePattern + "[,]" + i + "[.]" + i

      var hLabels
      var aLabels
      if (mh.textContent.trim() !== '') {
        hLabels = mh.textContent.replace(" ", "").split(",")
        aLabels = answerHarms[i].textContent.replace(" ", "")
      } else { // in case of figured bass
        hLabels = mh.querySelectorAll("f").map(f => f.textContent)
        aLabels = answerHarms[i].querySelectorAll("f").map(f => f.textContent)
      }
      const hasNoMistake = hLabels.some(hl => hl === aLabels)
      if (hasNoMistake) {
        this.response = this.response + "[,]" + i + "[.]" + i
        this.correct.push(answerHarms[i].id)
        this.points += 1
      } else {
        this.response = this.response + "[,]" + i + "[.]" + (modelHarms.length + idxCounter).toString()
        this.dummySource.push(answerHarms[i].textContent)
        this.wrong.push(answerHarms[i].id)
        idxCounter += 1
      }
    })

    this.summarizeScoringValues()
  }


  AnalysisScore4LMS.prototype.evaluatePitch = function () {

    var modelDoc = this.makeDoc(this.solutionMEI)
    var answerDoc = this.noteInputField?.getMei(true)
    if (!modelDoc || !answerDoc) return
    var modelNotes = modelDoc.querySelectorAll("note, rest")
    var answerNotes = answerDoc.querySelectorAll("note, rest")


    this.initScoringValues()

    var idxCounter = 0

    modelNotes.forEach((mn, i) => {
      var answerNote = answerNotes[i]
      this.source.push(mn)
      this.correctResponsePattern = this.correctResponsePattern + "[,]" + i + "[.]" + i

      var modelAttrs = {
        pname: mn?.getAttribute("pname"),
        oct: this.checkOctavePosition ? mn?.getAttribute("oct") : null
      }

      var answerAttrs = {
        pname: answerNote?.getAttribute("pname"),
        oct: this.checkOctavePosition ? answerNote?.getAttribute("oct") : null
      }

      var isCorrect = modelAttrs.pname === answerAttrs.pname && modelAttrs.oct === answerAttrs.oct
      if (isCorrect) {
        this.response = this.response + "[,]" + i + "[.]" + i
        this.correct.push(answerNote.id)
        this.points += 1
      } else {
        this.response = this.response + "[,]" + i + "[.]" + (modelNotes.length + idxCounter).toString()
        this.dummySource.push(answerAttrs)
        this.wrong.push(answerNote.id)
        idxCounter += 1
      }
    })

    this.summarizeScoringValues()
  }

  AnalysisScore4LMS.prototype.evaluateRhythm = function () {
    var modelDoc = this.makeDoc(this.solutionMEI)
    var answerDoc = this.noteInputField?.getMei(true)
    if (!modelDoc || !answerDoc) return
    var modelDurs = modelDoc.querySelectorAll("[dur]")
    var answerDurs = answerDoc.querySelectorAll("[dur]")

    this.initScoringValues()

    var idxCounter = 0

    function joinDurs(element) {
      var dur = element.getAttribute("dur")
      var dots = element.getAttribute("dots")
      switch (dots) {
        case "0":
          dots = ""
          break;
        case "1":
          dots = "."
          break;
        case "2":
          dots = ".."
          break;
        default:
          dots = ""
          break;
      }
      return dur + dots
    }

    modelDurs.forEach((md, i) => {
      var modelDur = joinDurs(md)
      var answerDur = joinDurs(answerDurs[i])
      this.source.push(modelDur)
      this.correctResponsePattern = this.correctResponsePattern + "[,]" + i + "[.]" + i
      var isCorrect = modelDur === answerDur
      if (isCorrect) {
        this.response = this.response + "[,]" + i + "[.]" + i
        this.correct.push(answerDurs[i].id)
        this.points += 1
      } else {
        this.response = this.response + "[,]" + i + "[.]" + (modelDurs.length + idxCounter).toString()
        this.dummySource.push(answerDur)
        this.wrong.push(answerDurs[i].id)
        idxCounter += 1
      }
    })

    this.summarizeScoringValues()

  }

  AnalysisScore4LMS.prototype.evaluateTextboxes = function () {
    this.initScoringValues()

    function calculateSimilarity(str1, str2) {

      if (!str1 || !str2) return 0

      str1 = str1.toLowerCase();
      str2 = str2.toLowerCase();

      if (str1 === str2) return 1 // dont calculate if two strings are identical

      // Function to tokenize a string into words
      function tokenizeString(input) {
        return new Set(input.split(' '));
      }

      // Calculate Levenshtein distance
      function levenshteinDistance(s1, s2) {
        const len1 = s1.length;
        const len2 = s2.length;

        // Create a 2D array to store the distances
        const dp = [];

        for (let i = 0; i <= len1; i++) {
          dp[i] = [];
          for (let j = 0; j <= len2; j++) {
            if (i === 0) {
              dp[i][j] = j;
            } else if (j === 0) {
              dp[i][j] = i;
            } else {
              const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
              dp[i][j] = Math.min(
                dp[i - 1][j] + 1,         // Deletion
                dp[i][j - 1] + 1,         // Insertion
                dp[i - 1][j - 1] + cost  // Substitution
              );
            }
          }
        }

        return dp[len1][len2];
      }

      var set1 = tokenizeString(str1);
      var set2 = tokenizeString(str2);

      set1 = sw.removeStopwords(Array.from(set1), sw.eng)
      set1 = sw.removeStopwords(set2, sw.deu)

      set2 = sw.removeStopwords(Array.from(set2), sw.eng)
      set2 = sw.emoveStopwords(set2, sw.deu)

      // Calculate Jaccard similarity
      const intersectionSize = [...set1].filter(word => set2.has(word)).length;
      const unionSize = set1.size + set2.size;
      const jaccardSimilarity = intersectionSize / unionSize;

      // Calculate Levenshtein distance
      const levenshteinDist = levenshteinDistance(str1, str2);
      const levenshteinSimilarity = 1 - levenshteinDist / Math.max(str1.length, str2.length)

      // Define the weights for both similarity measures
      const jaccardWeight = 0.3;
      const levenshteinWeight = 1 - jaccardWeight;

      // Combine the similarity measures using weights
      return (jaccardWeight * jaccardSimilarity) + (levenshteinWeight * levenshteinSimilarity);
    }

    var parser = new DOMParser()
    var modelAnnots = sanitizeXMLString(this.params.as4lControllerGroup?.dataStorageGroup?.annotationSolutionField)
    modelAnnots = parser.parseFromString(modelAnnots, "text/xml").querySelectorAll("g")
    var answerAnnots = this.noteInputField?.getAnnotationSVG()?.querySelectorAll("g")

    var idxCounter = 0
    modelAnnots.forEach((ma, i) => {
      const sa = Array.from(answerAnnots).filter(node => node.id === ma.id)[0] // there should be only one element anyway
      const isCorrect = calculateSimilarity(ma.querySelector(".annotDiv")?.textContent, sa?.querySelector(".annotDiv")?.textContent) > 0.4 // experiment a little with the threshold
      if (isCorrect) {
        this.response = this.response + "[,]" + i + "[.]" + i
        this.correct.push(sa.id)
        this.points += 1
      } else {
        this.response = this.response + "[,]" + i + "[.]" + (modelAnnots.length + idxCounter).toString()
        this.dummySource.push(sa?.querySelector(".annotDiv")?.textContent || "")
        this.wrong.push(ma.id)
        idxCounter += 1
      }
    })

    this.summarizeScoringValues()
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


  /* 
   * Compute the score for the results.
   * @param {Object[]} results - Results from the task.
   * @return {number} Score.
   */
  AnalysisScore4LMS.prototype.computeScore = function (results) {
    return this.points / this.source.length * 100;
  };


  /**
   * Handle buttons' visibility.
   * @param {number} score - Score the user received.
   */
  AnalysisScore4LMS.prototype.handleButtons = function (score) {
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
      if (this.getScore() < this.pointsPassing) {
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
    var interactionType = "long-fill-in";

    if (this.noChecks) {
      interactionType = "matching"
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

    switch (interactionType) {
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
            "description": {
              "en-US": s + "\n"
            }
          }
          definition.source[i] = x
        })
        this.target.forEach((t, i) => {
          let x = {
            "id": i,
            "description": {
              "en-US": t + "\n"
            }
          }
          definition.target[i] = x
        })
        //dummySource is needed to display wrong answers in Task Evaluation. CorrectResponsesPattern MUST NOT contain these indizes
        this.dummySource.forEach((d, i) => {
          let x = {
            "id": definition.source.length,
            "description": {
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