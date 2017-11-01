'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TypeaheadEditor = exports.normalizeSelectedIndex = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _draftJs = require('draft-js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function normalizeSelectedIndex(selectedIndex, max) {
  var index = selectedIndex % max;
  if (index < 0) {
    index += max;
  }
  return index;
}

var TypeaheadEditor = function (_Editor) {
  _inherits(TypeaheadEditor, _Editor);

  function TypeaheadEditor(props) {
    _classCallCheck(this, TypeaheadEditor);

    var _this = _possibleConstructorReturn(this, (TypeaheadEditor.__proto__ || Object.getPrototypeOf(TypeaheadEditor)).call(this, props));

    _this.onChange = function (editorState) {
      _this.props.onChange(editorState);

      // Set typeahead visibility. Wait a frame to ensure that the cursor is
      // updated.
      if (_this.props.onTypeaheadChange) {
        window.requestAnimationFrame(function () {
          _this.props.onTypeaheadChange(_this.getTypeaheadState());
        });
      }
    };

    _this.onEscape = function (e) {
      if (!_this.getTypeaheadState(false)) {
        _this.props.onEscape && _this.props.onEscape(e);
        return;
      }

      e.preventDefault();
      _this.typeaheadState = null;

      _this.props.onTypeaheadChange && _this.props.onTypeaheadChange(null);
    };

    _this.onUpArrow = function (e) {
      _this.onArrow(e, _this.props.onUpArrow, -1);
    };

    _this.onDownArrow = function (e) {
      _this.onArrow(e, _this.props.onDownArrow, 1);
    };

    _this.handleReturn = function (e) {
      if (_this.typeaheadState) {
        if (_this.props.handleTypeaheadReturn) {
          var contentState = _this.props.editorState.getCurrentContent();

          var selection = contentState.getSelectionAfter();
          var entitySelection = selection.set('anchorOffset', selection.getFocusOffset() - _this.typeaheadState.text.length);

          _this.props.handleTypeaheadReturn(_this.typeaheadState.text, _this.typeaheadState.selectedIndex, entitySelection);

          _this.typeaheadState = null;
          _this.props.onTypeaheadChange && _this.props.onTypeaheadChange(null);
        } else {
          console.error("Warning: A typeahead is showing and return was pressed but `handleTypeaheadReturn` " + "isn't implemented.");
        }
        return true;
      }
      return false;
    };

    _this.typeaheadState = null;
    return _this;
  }

  _createClass(TypeaheadEditor, [{
    key: 'hasEntityAtSelection',
    value: function hasEntityAtSelection() {
      var editorState = this.props.editorState;


      var selection = editorState.getSelection();
      if (!selection.getHasFocus()) {
        return false;
      }

      var contentState = editorState.getCurrentContent();
      var block = contentState.getBlockForKey(selection.getStartKey());
      return !!block.getEntityAt(selection.getStartOffset() - 1);
    }
  }, {
    key: 'getTypeaheadRange',
    value: function getTypeaheadRange() {
      var selection = window.getSelection();
      if (selection.rangeCount === 0) {
        return null;
      }

      if (this.hasEntityAtSelection()) {
        return null;
      }

      var range = selection.getRangeAt(0);
      var text = range.startContainer.textContent;

      // Remove text that appears after the cursor..
      text = text.substring(0, range.startOffset);

      // ..and before the typeahead token.
      var index = text.lastIndexOf('@');
      if (index === -1) {
        return null;
      }
      text = text.substring(index);

      return {
        text: text,
        start: index,
        end: range.startOffset
      };
    }
  }, {
    key: 'getTypeaheadState',
    value: function getTypeaheadState() {
      var invalidate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      if (!invalidate) {
        return this.typeaheadState;
      }

      var typeaheadRange = this.getTypeaheadRange();
      if (!typeaheadRange) {
        this.typeaheadState = null;
        return null;
      }

      var tempRange = window.getSelection().getRangeAt(0).cloneRange();
      tempRange.setStart(tempRange.startContainer, typeaheadRange.start);

      var rangeRect = tempRange.getBoundingClientRect();
      var _ref = [rangeRect.left, rangeRect.bottom],
          left = _ref[0],
          top = _ref[1];


      this.typeaheadState = {
        left: left,
        top: top,
        text: typeaheadRange.text,
        selectedIndex: 0
      };
      return this.typeaheadState;
    }
  }, {
    key: 'onArrow',
    value: function onArrow(e, originalHandler, nudgeAmount) {
      var typeaheadState = this.getTypeaheadState(false);

      if (!typeaheadState) {
        originalHandler && originalHandler(e);
        return;
      }

      e.preventDefault();
      typeaheadState.selectedIndex += nudgeAmount;
      this.typeaheadState = typeaheadState;

      this.props.onTypeaheadChange && this.props.onTypeaheadChange(typeaheadState);
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          onChange = _props.onChange,
          onEscape = _props.onEscape,
          onUpArrow = _props.onUpArrow,
          onDownArrow = _props.onDownArrow,
          onTypeaheadChange = _props.onTypeaheadChange,
          other = _objectWithoutProperties(_props, ['onChange', 'onEscape', 'onUpArrow', 'onDownArrow', 'onTypeaheadChange']);

      return _react2.default.createElement(_draftJs.Editor, _extends({}, other, {
        onChange: this.onChange,
        onEscape: this.onEscape,
        onUpArrow: this.onUpArrow,
        onDownArrow: this.onDownArrow,
        handleReturn: this.handleReturn
      }));
    }
  }]);

  return TypeaheadEditor;
}(_draftJs.Editor);

;

exports.normalizeSelectedIndex = normalizeSelectedIndex;
exports.TypeaheadEditor = TypeaheadEditor;