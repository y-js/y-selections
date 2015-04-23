(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var YSelections;

YSelections = (function() {
  function YSelections() {
    this._listeners = [];
    this._composition_value = [];
    this._lists = [];
  }

  YSelections.prototype._name = "Selections";

  YSelections.prototype._getModel = function(Y, Operation) {
    if (this._model == null) {
      this._model = new Operation.Composition(this, []).execute();
    }
    return this._model;
  };

  YSelections.prototype._setModel = function(_model) {
    this._model = _model;
  };

  YSelections.prototype._getCompositionValue = function() {
    var composition_value, composition_value_operations, i, v;
    composition_value_operations = {};
    composition_value = (function() {
      var _i, _len, _ref, _results;
      _ref = this._composition_value;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        v = _ref[i];
        composition_value_operations["" + i + "/from"] = v.from;
        composition_value_operations["" + i + "/to"] = v.to;
        _results.push({
          attrs: v.attrs
        });
      }
      return _results;
    }).call(this);
    return {
      composition_value: composition_value,
      composition_value_operations: composition_value_operations
    };
  };

  YSelections.prototype._setCompositionValue = function(composition_value) {
    var v, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = composition_value.length; _i < _len; _i++) {
      v = composition_value[_i];
      v.type = "select";
      _results.push(this._apply(v));
    }
    return _results;
  };

  YSelections.prototype._apply = function(delta) {
    var attr, attr_list, combine_selection_to_left, compare_objects, createSelection, cut_off_from, cut_off_to, end, extendSelection, from, l, n, o, observer_call, selection, selection_is_empty, start, to, undos, v, _i, _len, _ref, _ref1;
    undos = [];
    from = delta.from;
    to = delta.to;
    (function(_this) {
      return (function() {
        var p, parent, parent_exists, _i, _len, _ref;
        parent = from.getParent();
        parent_exists = false;
        _ref = _this._lists;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          if (parent === _this._lists[p]) {
            parent_exists = true;
            break;
          }
        }
        if (!parent_exists) {
          return parent.observe(function(events) {
            var event, next, prev, ref, sel, _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = events.length; _j < _len1; _j++) {
              event = events[_j];
              if (event.type === "delete" && (event.reference.selection != null)) {
                ref = event.reference;
                sel = ref.selection;
                delete ref.selection;
                if (sel.from === ref && sel.to === ref) {
                  _results.push(_this._removeFromCompositionValue(sel));
                } else if (sel.from === ref) {
                  prev = ref.getNext();
                  sel.from = prev;
                  _results.push(prev.selection = sel);
                } else if (sel.to === ref) {
                  next = ref.getPrev();
                  sel.to = next;
                  _results.push(next.selection = sel);
                } else {
                  throw new Error("Found weird inconsistency! Y.Selections is no longer safe to use!");
                }
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          });
        }
      });
    })(this)();
    observer_call = {
      from: from,
      to: to,
      type: delta.type,
      attrs: delta.attrs
    };
    _ref = this._listeners;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      l = _ref[_i];
      l.call(this, observer_call);
    }
    createSelection = (function(_this) {
      return function(from, to, attrs) {
        var n, new_attrs, new_sel, v;
        new_attrs = {};
        for (n in attrs) {
          v = attrs[n];
          new_attrs[n] = v;
        }
        new_sel = {
          from: from,
          to: to,
          attrs: new_attrs
        };
        _this._composition_value.push(new_sel);
        return new_sel;
      };
    })(this);
    extendSelection = function(selection) {
      var n, undo_attrs, undo_attrs_list, undo_need_select, undo_need_unselect, v, _j, _len1, _ref1, _ref2;
      if (delta.type === "unselect") {
        undo_attrs = {};
        _ref1 = delta.attrs;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          n = _ref1[_j];
          if (selection.attrs[n] != null) {
            undo_attrs[n] = selection.attrs[n];
          }
          delete selection.attrs[n];
        }
        return undos.push({
          from: delta.from,
          to: delta.to,
          attrs: undo_attrs,
          type: "select"
        });
      } else {
        undo_attrs = {};
        undo_attrs_list = [];
        undo_need_unselect = false;
        undo_need_select = false;
        _ref2 = delta.attrs;
        for (n in _ref2) {
          v = _ref2[n];
          if (selection.attrs[n] != null) {
            undo_attrs[n] = selection.attrs[n];
            undo_need_select = true;
          } else {
            undo_attrs_list.push(n);
            undo_need_unselect = true;
          }
          selection.attrs[n] = v;
        }
        if (undo_need_select) {
          undos.push({
            from: delta.from,
            to: delta.to,
            attrs: undo_attrs,
            type: "select"
          });
        }
        if (undo_need_unselect) {
          return undos.push({
            from: delta.from,
            to: delta.to,
            attrs: undo_attrs_list,
            type: "unselect"
          });
        }
      }
    };
    cut_off_from = function() {
      var new_selection, o, old_selection, opt_selection;
      if ((from.selection != null) && from.selection.from === from) {
        return;
      }
      o = from.prev_cl;
      while ((o.selection == null) && (o.type !== "Delimiter")) {
        o = o.prev_cl;
      }
      if ((o.selection == null) || o.selection.to === o) {
        return;
      }
      old_selection = o.selection;
      o = from;
      while ((o !== old_selection.to) && (o !== to)) {
        o = o.next_cl;
      }
      if (o === old_selection.to) {
        new_selection = createSelection(from, old_selection.to, old_selection.attrs);
        old_selection.to = from.prev_cl;
        old_selection.to.selection = old_selection;
        new_selection.from.selection = new_selection;
        return new_selection.to.selection = new_selection;
      } else {
        new_selection = createSelection(from, to, old_selection.attrs);
        opt_selection = createSelection(to.next_cl, old_selection.to, old_selection.attrs);
        old_selection.to = from.prev_cl;
        old_selection.to.selection = old_selection;
        opt_selection.from.selection = opt_selection;
        opt_selection.to.selection = opt_selection;
        new_selection.from.selection = new_selection;
        return new_selection.to.selection = new_selection;
      }
    };
    cut_off_from();
    cut_off_to = function() {
      var new_selection, o, old_selection;
      if ((to.selection != null) && to.selection.to === to) {
        return;
      }
      o = to;
      while ((o.selection == null) && (o !== from)) {
        o = o.prev_cl;
      }
      if ((o.selection == null) || o.selection["to"] === o) {
        return;
      }
      old_selection = o.selection;
      new_selection = createSelection(to.next_cl, old_selection.to, old_selection.attrs);
      old_selection.to = to;
      old_selection.to.selection = old_selection;
      new_selection.from.selection = new_selection;
      return new_selection.to.selection = new_selection;
    };
    cut_off_to();
    compare_objects = function(o, p, doAgain) {
      var n, v;
      if (doAgain == null) {
        doAgain = true;
      }
      for (n in o) {
        v = o[n];
        if (!((p[n] != null) && p[n] === v)) {
          return false;
        }
      }
      if (doAgain) {
        return compare_objects(p, o, false);
      } else {
        return true;
      }
    };
    combine_selection_to_left = (function(_this) {
      return function(sel) {
        var first_o, new_from;
        first_o = sel.from.prev_cl;
        while ((first_o != null) && first_o.isDeleted() && (first_o.selection == null)) {
          first_o = first_o.prev_cl;
        }
        if (!((first_o != null) && (first_o.selection != null))) {

        } else {
          if (compare_objects(first_o.selection.attrs, sel.attrs)) {
            new_from = first_o.selection.from;
            _this._removeFromCompositionValue(first_o.selection);
            if (sel.from !== sel.to) {
              delete sel.from.selection;
            }
            sel.from = new_from;
            return new_from.selection = sel;
          } else {

          }
        }
      };
    })(this);
    o = from;
    while (o !== to.next_cl) {
      if (o.selection != null) {
        extendSelection(o.selection, delta);
        selection = o.selection;
        combine_selection_to_left(selection);
        o = selection.to.next_cl;
        selection_is_empty = true;
        for (attr in selection.attrs) {
          selection_is_empty = false;
          break;
        }
        if (selection_is_empty) {
          this._removeFromCompositionValue(selection);
        }
      } else {
        start = o;
        while ((o.next_cl.selection == null) && (o !== to)) {
          o = o.next_cl;
        }
        end = o;
        if (delta.type !== "unselect") {
          attr_list = [];
          _ref1 = delta.attrs;
          for (n in _ref1) {
            v = _ref1[n];
            attr_list.push(n);
          }
          undos.push({
            from: start,
            to: end,
            attrs: attr_list,
            type: "unselect"
          });
          selection = createSelection(start, end, delta.attrs);
          start.selection = selection;
          end.selection = selection;
          combine_selection_to_left(o.selection);
        }
        o = o.next_cl;
      }
    }
    while (o.isDeleted() && (o.selection == null)) {
      o = o.next_cl;
    }
    if (o.selection != null) {
      combine_selection_to_left(o.selection);
    }
    if (from.selection != null) {
      combine_selection_to_left(from.selection);
    }
    return delta;
  };

  YSelections.prototype._removeFromCompositionValue = function(sel) {
    this._composition_value = this._composition_value.filter(function(o) {
      return o !== sel;
    });
    delete sel.from.selection;
    return delete sel.to.selection;
  };

  YSelections.prototype._unapply = function(deltas) {
    var delta, _i, _len;
    for (_i = 0, _len = deltas.length; _i < _len; _i++) {
      delta = deltas[_i];
      this._apply(delta);
    }
  };

  YSelections.prototype.select = function(from, to, attrs) {
    var a, delta, delta_operations, length;
    length = 0;
    for (a in attrs) {
      length++;
      break;
    }
    if (length <= 0) {
      return;
    }
    delta_operations = {
      from: from,
      to: to
    };
    delta = {
      attrs: attrs,
      type: "select"
    };
    return this._model.applyDelta(delta, delta_operations);
  };

  YSelections.prototype.unselect = function(from, to, attrs) {
    var delta, delta_operations;
    if (typeof attrs === "string") {
      attrs = [attrs];
    }
    if (attrs.constructor !== Array) {
      throw new Error("Y.Selections.prototype.unselect expects an Array or String as the third parameter (attributes)!");
    }
    if (attrs.length <= 0) {
      return;
    }
    delta_operations = {
      from: from,
      to: to
    };
    delta = {
      attrs: attrs,
      type: "unselect"
    };
    return this._model.applyDelta(delta, delta_operations);
  };

  YSelections.prototype.getSelections = function(list) {
    var attrs, n, number_of_attrs, o, pos, result, sel_start, v, _ref;
    o = list.ref(0);
    if (o == null) {
      return [];
    }
    sel_start = null;
    pos = 0;
    result = [];
    while (o.next_cl != null) {
      if (o.isDeleted()) {
        o = o.next_cl;
        continue;
      }
      if (o.selection != null) {
        if (o.selection.from === o) {
          if (sel_start != null) {
            throw new Error("Found two consecutive from elements. The selections are no longer safe to use! (contact the owner of the repository)");
          } else {
            sel_start = pos;
          }
        }
        if (o.selection.to === o) {
          if (sel_start != null) {
            number_of_attrs = 0;
            attrs = {};
            _ref = o.selection.attrs;
            for (n in _ref) {
              v = _ref[n];
              attrs[n] = v;
              number_of_attrs++;
            }
            if (number_of_attrs > 0) {
              result.push({
                from: sel_start,
                to: pos,
                attrs: attrs
              });
            }
            sel_start = null;
          } else {
            throw new Error("Found two consecutive to elements. The selections are no longer safe to use! (contact the owner of the repository)");
          }
        } else if (o.selection.from !== o) {
          throw new Error("This reference should not point to this selection, because the selection does not point to the reference. The selections are no longer safe to use! (contact the owner of the repository)");
        }
      }
      pos++;
      o = o.next_cl;
    }
    return result;
  };

  YSelections.prototype.observe = function(f) {
    return this._listeners.push(f);
  };

  YSelections.prototype.unobserve = function(f) {
    return this._listeners = this._listeners.filter(function(g) {
      return f !== g;
    });
  };

  return YSelections;

})();

if (typeof window !== "undefined" && window !== null) {
  if (window.Y != null) {
    window.Y.Selections = YSelections;
  } else {
    throw new Error("You must first import Y!");
  }
}

if (typeof module !== "undefined" && module !== null) {
  module.exports = YSelections;
}


},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkg6XFxHaXRIdWJcXHktc2VsZWN0aW9uc1xcbm9kZV9tb2R1bGVzXFxndWxwLWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiSDpcXEdpdEh1YlxceS1zZWxlY3Rpb25zXFxsaWJcXHktc2VsZWN0aW9ucy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNHQSxJQUFBLFdBQUE7O0FBQUE7QUFDZSxFQUFBLHFCQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFBZCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsRUFEdEIsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxFQUhWLENBRFc7RUFBQSxDQUFiOztBQUFBLHdCQU1BLEtBQUEsR0FBTyxZQU5QLENBQUE7O0FBQUEsd0JBUUEsU0FBQSxHQUFXLFNBQUMsQ0FBRCxFQUFJLFNBQUosR0FBQTtBQUNULElBQUEsSUFBTyxtQkFBUDtBQUNFLE1BQUEsSUFBQyxDQUFBLE1BQUQsR0FBYyxJQUFBLFNBQVMsQ0FBQyxXQUFWLENBQXNCLElBQXRCLEVBQXlCLEVBQXpCLENBQTRCLENBQUMsT0FBN0IsQ0FBQSxDQUFkLENBREY7S0FBQTtXQUVBLElBQUMsQ0FBQSxPQUhRO0VBQUEsQ0FSWCxDQUFBOztBQUFBLHdCQWFBLFNBQUEsR0FBVyxTQUFFLE1BQUYsR0FBQTtBQUFVLElBQVQsSUFBQyxDQUFBLFNBQUEsTUFBUSxDQUFWO0VBQUEsQ0FiWCxDQUFBOztBQUFBLHdCQWVBLG9CQUFBLEdBQXNCLFNBQUEsR0FBQTtBQUNwQixRQUFBLHFEQUFBO0FBQUEsSUFBQSw0QkFBQSxHQUErQixFQUEvQixDQUFBO0FBQUEsSUFDQSxpQkFBQTs7QUFBb0I7QUFBQTtXQUFBLG1EQUFBO29CQUFBO0FBQ2xCLFFBQUEsNEJBQTZCLENBQUEsRUFBQSxHQUFH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aWJBLElBQUcsZ0RBQUg7QUFDRSxFQUFBLElBQUcsZ0JBQUg7QUFDRSxJQUFBLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVCxHQUFzQixXQUF0QixDQURGO0dBQUEsTUFBQTtBQUdFLFVBQVUsSUFBQSxLQUFBLENBQU0sMEJBQU4sQ0FBVixDQUhGO0dBREY7Q0FqYkE7O0FBdWJBLElBQUcsZ0RBQUg7QUFDRSxFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFdBQWpCLENBREY7Q0F2YkEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXHJcblxyXG5cclxuY2xhc3MgWVNlbGVjdGlvbnNcclxuICBjb25zdHJ1Y3RvcjogKCktPlxyXG4gICAgQF9saXN0ZW5lcnMgPSBbXVxyXG4gICAgQF9jb21wb3NpdGlvbl92YWx1ZSA9IFtdXHJcbiAgICAjIHdlIHB1dCBhbGwgdGhlIGxpc3RzIHdlIHVzZSBpbiB0aGlzIGFycmF5XHJcbiAgICBAX2xpc3RzID0gW11cclxuXHJcbiAgX25hbWU6IFwiU2VsZWN0aW9uc1wiXHJcblxyXG4gIF9nZXRNb2RlbDogKFksIE9wZXJhdGlvbikgLT5cclxuICAgIGlmIG5vdCBAX21vZGVsP1xyXG4gICAgICBAX21vZGVsID0gbmV3IE9wZXJhdGlvbi5Db21wb3NpdGlvbihALCBbXSkuZXhlY3V0ZSgpXHJcbiAgICBAX21vZGVsXHJcblxyXG4gIF9zZXRNb2RlbDogKEBfbW9kZWwpLT5cclxuXHJcbiAgX2dldENvbXBvc2l0aW9uVmFsdWU6ICgpLT5cclxuICAgIGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnMgPSB7fVxyXG4gICAgY29tcG9zaXRpb25fdmFsdWUgPSBmb3IgdixpIGluIEBfY29tcG9zaXRpb25fdmFsdWVcclxuICAgICAgY29tcG9zaXRpb25fdmFsdWVfb3BlcmF0aW9uc1tcIlwiK2krXCIvZnJvbVwiXSA9IHYuZnJvbVxyXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zW1wiXCIraStcIi90b1wiXSA9IHYudG9cclxuICAgICAge1xyXG4gICAgICAgIGF0dHJzOiB2LmF0dHJzXHJcbiAgICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZSA6IGNvbXBvc2l0aW9uX3ZhbHVlXHJcbiAgICAgIGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnM6IGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnNcclxuICAgIH1cclxuXHJcblxyXG4gIF9zZXRDb21wb3NpdGlvblZhbHVlOiAoY29tcG9zaXRpb25fdmFsdWUpLT5cclxuICAgIGZvciB2IGluIGNvbXBvc2l0aW9uX3ZhbHVlXHJcbiAgICAgIHYudHlwZSA9IFwic2VsZWN0XCJcclxuICAgICAgQF9hcHBseSB2XHJcblxyXG4gIF9hcHBseTogKGRlbHRhKS0+XHJcbiAgICB1bmRvcyA9IFtdICMgbGlzdCBvZiBkZWx0YXMgdGhhdCBhcmUgbmVjZXNzYXJ5IHRvIHVuZG8gdGhlIGNoYW5nZVxyXG4gICAgZnJvbSA9IGRlbHRhLmZyb21cclxuICAgIHRvID0gZGVsdGEudG9cclxuXHJcbiAgICAjIGlmIG5ldmVyIGFwcGxpZWQgYSBkZWx0YSBvbiB0aGlzIGxpc3QsIGFkZCBhIGxpc3RlbmVyIHRvIGl0IGluIG9yZGVyIHRvIGNoYW5nZSBzZWxlY3Rpb25zIGlmIG5lY2Vzc2FyeVxyXG4gICAgZG8gKCk9PlxyXG4gICAgICBwYXJlbnQgPSBmcm9tLmdldFBhcmVudCgpXHJcbiAgICAgIHBhcmVudF9leGlzdHMgPSBmYWxzZVxyXG4gICAgICBmb3IgcCBpbiBAX2xpc3RzXHJcbiAgICAgICAgaWYgcGFyZW50IGlzIEBfbGlzdHNbcF1cclxuICAgICAgICAgIHBhcmVudF9leGlzdHMgPSB0cnVlXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICBpZiBub3QgcGFyZW50X2V4aXN0c1xyXG4gICAgICAgIHBhcmVudC5vYnNlcnZlIChldmVudHMpPT5cclxuICAgICAgICAgIGZvciBldmVudCBpbiBldmVudHNcclxuICAgICAgICAgICAgaWYgZXZlbnQudHlwZSBpcyBcImRlbGV0ZVwiIGFuZCBldmVudC5yZWZlcmVuY2Uuc2VsZWN0aW9uP1xyXG4gICAgICAgICAgICAgIHJlZiA9IGV2ZW50LnJlZmVyZW5jZVxyXG4gICAgICAgICAgICAgIHNlbCA9IHJlZi5zZWxlY3Rpb25cclxuICAgICAgICAgICAgICBkZWxldGUgcmVmLnNlbGVjdGlvbiAjIGRlbGV0ZSBpdCwgYmVjYXVzZSByZWYgaXMgZ29pbmcgdG8gZ2V0IGRlbGV0ZWQhXHJcbiAgICAgICAgICAgICAgaWYgc2VsLmZyb20gaXMgcmVmIGFuZCBzZWwudG8gaXMgcmVmXHJcbiAgICAgICAgICAgICAgICBAX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlIHNlbFxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgc2VsLmZyb20gaXMgcmVmXHJcbiAgICAgICAgICAgICAgICBwcmV2ID0gcmVmLmdldE5leHQoKVxyXG4gICAgICAgICAgICAgICAgc2VsLmZyb20gPSBwcmV2XHJcbiAgICAgICAgICAgICAgICBwcmV2LnNlbGVjdGlvbiA9IHNlbFxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgc2VsLnRvIGlzIHJlZlxyXG4gICAgICAgICAgICAgICAgbmV4dCA9IHJlZi5nZXRQcmV2KClcclxuICAgICAgICAgICAgICAgIHNlbC50byA9IG5leHRcclxuICAgICAgICAgICAgICAgIG5leHQuc2VsZWN0aW9uID0gc2VsXHJcbiAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiRm91bmQgd2VpcmQgaW5jb25zaXN0ZW5jeSEgWS5TZWxlY3Rpb25zIGlzIG5vIGxvbmdlciBzYWZlIHRvIHVzZSFcIlxyXG5cclxuXHJcblxyXG5cclxuICAgICMgbm90aWZ5IGxpc3RlbmVyczpcclxuICAgIG9ic2VydmVyX2NhbGwgPVxyXG4gICAgICBmcm9tOiBmcm9tXHJcbiAgICAgIHRvOiB0b1xyXG4gICAgICB0eXBlOiBkZWx0YS50eXBlXHJcbiAgICAgIGF0dHJzOiBkZWx0YS5hdHRyc1xyXG4gICAgZm9yIGwgaW4gQF9saXN0ZW5lcnNcclxuICAgICAgbC5jYWxsIHRoaXMsIG9ic2VydmVyX2NhbGxcclxuICAgIGNyZWF0ZVNlbGVjdGlvbiA9IChmcm9tLCB0bywgYXR0cnMpPT5cclxuICAgICAgbmV3X2F0dHJzID0ge31cclxuICAgICAgZm9yIG4sdiBvZiBhdHRyc1xyXG4gICAgICAgIG5ld19hdHRyc1tuXSA9IHZcclxuICAgICAgbmV3X3NlbCA9IHtcclxuICAgICAgICBmcm9tOiBmcm9tXHJcbiAgICAgICAgdG86IHRvXHJcbiAgICAgICAgYXR0cnM6IG5ld19hdHRyc1xyXG4gICAgICB9XHJcbiAgICAgIEBfY29tcG9zaXRpb25fdmFsdWUucHVzaCBuZXdfc2VsXHJcbiAgICAgIG5ld19zZWxcclxuXHJcbiAgICBleHRlbmRTZWxlY3Rpb24gPSAoc2VsZWN0aW9uKS0+XHJcbiAgICAgIGlmIGRlbHRhLnR5cGUgaXMgXCJ1bnNlbGVjdFwiXHJcbiAgICAgICAgdW5kb19hdHRycyA9IHt9XHJcbiAgICAgICAgZm9yIG4gaW4gZGVsdGEuYXR0cnNcclxuICAgICAgICAgIGlmIHNlbGVjdGlvbi5hdHRyc1tuXT9cclxuICAgICAgICAgICAgdW5kb19hdHRyc1tuXSA9IHNlbGVjdGlvbi5hdHRyc1tuXVxyXG4gICAgICAgICAgZGVsZXRlIHNlbGVjdGlvbi5hdHRyc1tuXVxyXG4gICAgICAgIHVuZG9zLnB1c2hcclxuICAgICAgICAgIGZyb206IGRlbHRhLmZyb21cclxuICAgICAgICAgIHRvOiBkZWx0YS50b1xyXG4gICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNcclxuICAgICAgICAgIHR5cGU6IFwic2VsZWN0XCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHVuZG9fYXR0cnMgPSB7fSAjIGZvciB1bmRvIHNlbGVjdGlvbiAob3ZlcndyaXRlIG9mIGV4aXN0aW5nIHNlbGVjdGlvbilcclxuICAgICAgICB1bmRvX2F0dHJzX2xpc3QgPSBbXSAjIGZvciB1bmRvIHNlbGVjdGlvbiAobm90IG92ZXJ3cml0ZSlcclxuICAgICAgICB1bmRvX25lZWRfdW5zZWxlY3QgPSBmYWxzZVxyXG4gICAgICAgIHVuZG9fbmVlZF9zZWxlY3QgPSBmYWxzZVxyXG4gICAgICAgIGZvciBuLHYgb2YgZGVsdGEuYXR0cnNcclxuICAgICAgICAgIGlmIHNlbGVjdGlvbi5hdHRyc1tuXT9cclxuICAgICAgICAgICAgdW5kb19hdHRyc1tuXSA9IHNlbGVjdGlvbi5hdHRyc1tuXVxyXG4gICAgICAgICAgICB1bmRvX25lZWRfc2VsZWN0ID0gdHJ1ZVxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB1bmRvX2F0dHJzX2xpc3QucHVzaCBuXHJcbiAgICAgICAgICAgIHVuZG9fbmVlZF91bnNlbGVjdCA9IHRydWVcclxuICAgICAgICAgIHNlbGVjdGlvbi5hdHRyc1tuXSA9IHZcclxuICAgICAgICBpZiB1bmRvX25lZWRfc2VsZWN0XHJcbiAgICAgICAgICB1bmRvcy5wdXNoXHJcbiAgICAgICAgICAgIGZyb206IGRlbHRhLmZyb21cclxuICAgICAgICAgICAgdG86IGRlbHRhLnRvXHJcbiAgICAgICAgICAgIGF0dHJzOiB1bmRvX2F0dHJzXHJcbiAgICAgICAgICAgIHR5cGU6IFwic2VsZWN0XCJcclxuICAgICAgICBpZiB1bmRvX25lZWRfdW5zZWxlY3RcclxuICAgICAgICAgIHVuZG9zLnB1c2hcclxuICAgICAgICAgICAgZnJvbTogZGVsdGEuZnJvbVxyXG4gICAgICAgICAgICB0bzogZGVsdGEudG9cclxuICAgICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNfbGlzdFxyXG4gICAgICAgICAgICB0eXBlOiBcInVuc2VsZWN0XCJcclxuXHJcbiAgICAjIEFsZ29yaXRobSBvdmVydmlldzpcclxuICAgICMgMS4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoIGZyb21cclxuICAgICMgMi4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoIHRvXHJcbiAgICAjIDMuIGV4dGVuZCAvIGFkZCBzZWxlY3Rpb25zIGluYmV0d2VlblxyXG5cclxuICAgICNcclxuICAgICMjIyMgMS4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoIGZyb21cclxuICAgICNcclxuICAgIGN1dF9vZmZfZnJvbSA9ICgpLT5cclxuICAgICAgIyBjaGVjayBpZiBhIHNlbGVjdGlvbiAodG8gdGhlIGxlZnQgb2YgJGZyb20pIGludGVyc2VjdHMgd2l0aCAkZnJvbVxyXG4gICAgICBpZiBmcm9tLnNlbGVjdGlvbj8gYW5kIGZyb20uc2VsZWN0aW9uLmZyb20gaXMgZnJvbVxyXG4gICAgICAgICMgZG9lcyBub3QgaW50ZXJzZWN0LCBiZWNhdXNlIHRoZSBzdGFydCBpcyBhbHJlYWR5IHNlbGVjdGVkXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgICMgZmluZCBmaXJzdCBzZWxlY3Rpb24gdG8gdGhlIGxlZnRcclxuICAgICAgbyA9IGZyb20ucHJldl9jbFxyXG4gICAgICB3aGlsZSAobm90IG8uc2VsZWN0aW9uPykgYW5kIChvLnR5cGUgaXNudCBcIkRlbGltaXRlclwiKVxyXG4gICAgICAgIG8gPSBvLnByZXZfY2xcclxuICAgICAgaWYgKG5vdCBvLnNlbGVjdGlvbj8pIG9yIG8uc2VsZWN0aW9uLnRvIGlzIG9cclxuICAgICAgICAjIG5vIGludGVyc2VjdGlvblxyXG4gICAgICAgIHJldHVyblxyXG4gICAgICAjIFdlIGZvdW5kIGEgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoICRmcm9tLlxyXG4gICAgICAjIE5vdyB3ZSBoYXZlIHRvIGNoZWNrIGlmIGl0IGFsc28gaW50ZXJzZWN0cyB3aXRoICR0by5cclxuICAgICAgIyBUaGVuIHdlIGN1dCBpdCBpbiBzdWNoIGEgd2F5LFxyXG4gICAgICAjIHRoYXQgdGhlIHNlbGVjdGlvbiBkb2VzIG5vdCBpbnRlcnNlY3Qgd2l0aCAkZnJvbSBhbmQgJHRvIGFueW1vcmUuXHJcblxyXG4gICAgICAjIHRoaXMgaXMgYSByZWZlcmVuY2UgZm9yIHRoZSBzZWxlY3Rpb25zIHRoYXQgYXJlIGNyZWF0ZWQvbW9kaWZpZWQ6XHJcbiAgICAgICMgb2xkX3NlbGVjdGlvbiBpcyBvdXRlciAobm90IGJldHdlZW4gJGZyb20gJHRvKVxyXG4gICAgICAjICAgLSB3aWxsIGJlIGNoYW5nZWQgaW4gc3VjaCBhIHdheSB0aGF0IGl0IGlzIHRvIHRoZSBsZWZ0IG9mICRmcm9tXHJcbiAgICAgICMgbmV3X3NlbGVjdGlvbiBpcyBpbm5lciAoaW5iZXR3ZWVuICRmcm9tICR0bylcclxuICAgICAgIyAgIC0gY3JlYXRlZCwgcmlnaHQgYWZ0ZXIgJGZyb21cclxuICAgICAgIyBvcHRfc2VsZWN0aW9uIGlzIG91dGVyIChhZnRlciAkdG8pXHJcbiAgICAgICMgICAtIGNyZWF0ZWQgKGlmIG5lY2Vzc2FyeSksIHJpZ2h0IGFmdGVyICR0b1xyXG4gICAgICBvbGRfc2VsZWN0aW9uID0gby5zZWxlY3Rpb25cclxuXHJcbiAgICAgICMgY2hlY2sgaWYgZm91bmQgc2VsZWN0aW9uIGFsc28gaW50ZXJzZWN0cyB3aXRoICR0b1xyXG4gICAgICAjICogc3RhcnRpbmcgZnJvbSAkZnJvbSwgZ28gdG8gdGhlIHJpZ2h0IHVudGlsIHlvdSBmb3VuZCBlaXRoZXIgJHRvIG9yIG9sZF9zZWxlY3Rpb24udG9cclxuICAgICAgIyAqKiBpZiAkdG86IG5vIGludGVyc2VjdGlvbiB3aXRoICR0b1xyXG4gICAgICAjICoqIGlmICRvbGRfc2VsZWN0aW9uLnRvOiBpbnRlcnNlY3Rpb24gd2l0aCAkdG8hXHJcbiAgICAgIG8gPSBmcm9tXHJcbiAgICAgIHdoaWxlIChvIGlzbnQgb2xkX3NlbGVjdGlvbi50bykgYW5kIChvIGlzbnQgdG8pXHJcbiAgICAgICAgbyA9IG8ubmV4dF9jbFxyXG5cclxuICAgICAgaWYgbyBpcyBvbGRfc2VsZWN0aW9uLnRvXHJcbiAgICAgICAgIyBubyBpbnRlcnNlY3Rpb24gd2l0aCB0byFcclxuICAgICAgICAjIGNyZWF0ZSAkbmV3X3NlbGVjdGlvblxyXG4gICAgICAgIG5ld19zZWxlY3Rpb24gPSBjcmVhdGVTZWxlY3Rpb24gZnJvbSwgb2xkX3NlbGVjdGlvbi50bywgb2xkX3NlbGVjdGlvbi5hdHRyc1xyXG5cclxuICAgICAgICAjIHVwZGF0ZSByZWZlcmVuY2VzXHJcbiAgICAgICAgb2xkX3NlbGVjdGlvbi50byA9IGZyb20ucHJldl9jbFxyXG4gICAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXMgKHBvaW50ZXJzIHRvIHJlc3BlY3RpdmUgc2VsZWN0aW9ucylcclxuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9sZF9zZWxlY3Rpb25cclxuXHJcbiAgICAgICAgbmV3X3NlbGVjdGlvbi5mcm9tLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cclxuICAgICAgICBuZXdfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cclxuICAgICAgZWxzZVxyXG4gICAgICAgICMgdGhlcmUgaXMgYW4gaW50ZXJzZWN0aW9uIHdpdGggdG8hXHJcblxyXG4gICAgICAgICMgY3JlYXRlICRuZXdfc2VsZWN0aW9uXHJcbiAgICAgICAgbmV3X3NlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiBmcm9tLCB0bywgb2xkX3NlbGVjdGlvbi5hdHRyc1xyXG5cclxuICAgICAgICAjIGNyZWF0ZSAkb3B0X3NlbGVjdGlvblxyXG4gICAgICAgIG9wdF9zZWxlY3Rpb24gPSBjcmVhdGVTZWxlY3Rpb24gdG8ubmV4dF9jbCwgb2xkX3NlbGVjdGlvbi50bywgb2xkX3NlbGVjdGlvbi5hdHRyc1xyXG5cclxuICAgICAgICAjIHVwZGF0ZSByZWZlcmVuY2VzXHJcbiAgICAgICAgb2xkX3NlbGVjdGlvbi50byA9IGZyb20ucHJldl9jbFxyXG4gICAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXMgKHBvaW50ZXJzIHRvIHJlc3BlY3RpdmUgc2VsZWN0aW9ucylcclxuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9sZF9zZWxlY3Rpb25cclxuXHJcbiAgICAgICAgb3B0X3NlbGVjdGlvbi5mcm9tLnNlbGVjdGlvbiA9IG9wdF9zZWxlY3Rpb25cclxuICAgICAgICBvcHRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9wdF9zZWxlY3Rpb25cclxuXHJcbiAgICAgICAgbmV3X3NlbGVjdGlvbi5mcm9tLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cclxuICAgICAgICBuZXdfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cclxuXHJcblxyXG4gICAgY3V0X29mZl9mcm9tKClcclxuXHJcbiAgICAjIDIuIGN1dCBvZmYgdGhlIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCAkdG9cclxuICAgIGN1dF9vZmZfdG8gPSAoKS0+XHJcbiAgICAgICMgY2hlY2sgaWYgYSBzZWxlY3Rpb24gKHRvIHRoZSBsZWZ0IG9mICR0bykgaW50ZXJzZWN0cyB3aXRoICR0b1xyXG4gICAgICBpZiB0by5zZWxlY3Rpb24/IGFuZCB0by5zZWxlY3Rpb24udG8gaXMgdG9cclxuICAgICAgICAjIGRvZXMgbm90IGludGVyc2VjdCwgYmVjYXVzZSB0aGUgZW5kIGlzIGFscmVhZHkgc2VsZWN0ZWRcclxuICAgICAgICByZXR1cm5cclxuICAgICAgIyBmaW5kIGZpcnN0IHNlbGVjdGlvbiB0byB0aGUgbGVmdFxyXG4gICAgICBvID0gdG9cclxuICAgICAgd2hpbGUgKG5vdCBvLnNlbGVjdGlvbj8pIGFuZCAobyBpc250IGZyb20pXHJcbiAgICAgICAgbyA9IG8ucHJldl9jbFxyXG4gICAgICBpZiAobm90IG8uc2VsZWN0aW9uPykgb3Igby5zZWxlY3Rpb25bXCJ0b1wiXSBpcyBvXHJcbiAgICAgICAgIyBubyBpbnRlcnNlY3Rpb25cclxuICAgICAgICByZXR1cm5cclxuICAgICAgIyBXZSBmb3VuZCBhIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCAkdG8uXHJcbiAgICAgICMgTm93IHdlIGhhdmUgdG8gY3V0IGl0IGluIHN1Y2ggYSB3YXksXHJcbiAgICAgICMgdGhhdCB0aGUgc2VsZWN0aW9uIGRvZXMgbm90IGludGVyc2VjdCB3aXRoICR0byBhbnltb3JlLlxyXG5cclxuICAgICAgIyB0aGlzIGlzIGEgcmVmZXJlbmNlIGZvciB0aGUgc2VsZWN0aW9ucyB0aGF0IGFyZSBjcmVhdGVkL21vZGlmaWVkOlxyXG4gICAgICAjIGl0IGlzIHNpbWlsYXIgdG8gdGhlIG9uZSBhYm92ZSwgZXhjZXB0IHRoYXQgd2UgZG8gbm90IG5lZWQgb3B0X3NlbGVjdGlvbiBhbnltb3JlIVxyXG4gICAgICAjIG9sZF9zZWxlY3Rpb24gaXMgaW5uZXIgKGJldHdlZW4gJGZyb20gYW5kICR0bylcclxuICAgICAgIyAgIC0gd2lsbCBiZSBjaGFuZ2VkIGluIHN1Y2ggYSB3YXkgdGhhdCBpdCBpcyB0byB0aGUgbGVmdCBvZiAkdG9cclxuICAgICAgIyBuZXdfc2VsZWN0aW9uIGlzIG91dGVyICggb3V0ZXIgJGZyb20gYW5kICR0bylcclxuICAgICAgIyAgIC0gY3JlYXRlZCwgcmlnaHQgYWZ0ZXIgJHRvXHJcblxyXG4gICAgICBvbGRfc2VsZWN0aW9uID0gby5zZWxlY3Rpb25cclxuXHJcbiAgICAgICMgY3JlYXRlICRuZXdfc2VsZWN0aW9uXHJcbiAgICAgIG5ld19zZWxlY3Rpb24gPSBjcmVhdGVTZWxlY3Rpb24gdG8ubmV4dF9jbCwgb2xkX3NlbGVjdGlvbi50bywgb2xkX3NlbGVjdGlvbi5hdHRyc1xyXG5cclxuICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlc1xyXG4gICAgICBvbGRfc2VsZWN0aW9uLnRvID0gdG9cclxuICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlcyAocG9pbnRlcnMgdG8gcmVzcGVjdGl2ZSBzZWxlY3Rpb25zKVxyXG4gICAgICBvbGRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9sZF9zZWxlY3Rpb25cclxuXHJcbiAgICAgIG5ld19zZWxlY3Rpb24uZnJvbS5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXHJcbiAgICAgIG5ld19zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxyXG5cclxuICAgIGN1dF9vZmZfdG8oKVxyXG5cclxuICAgICMgY29tcGFyZSB0d28gb2JqZWN0IGZvciBlcXVhbGl0eSAobm8gZGVlcCBjaGVjayEpXHJcbiAgICBjb21wYXJlX29iamVjdHMgPSAobywgcCwgZG9BZ2Fpbj10cnVlKS0+XHJcbiAgICAgIGZvciBuLHYgb2Ygb1xyXG4gICAgICAgIGlmIG5vdCAocFtuXT8gYW5kIHBbbl0gaXMgdilcclxuICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICBpZiBkb0FnYWluXHJcbiAgICAgICAgY29tcGFyZV9vYmplY3RzKHAsbyxmYWxzZSlcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHRydWVcclxuXHJcbiAgICAjIHRyeSB0byBjb21iaW5lIGEgc2VsZWN0aW9uLCB0byB0aGUgc2VsZWN0aW9uIHRvIGl0cyBsZWZ0IChpZiB0aGVyZSBpcyBhbnkpXHJcbiAgICBjb21iaW5lX3NlbGVjdGlvbl90b19sZWZ0ID0gKHNlbCk9PlxyXG4gICAgICBmaXJzdF9vID0gc2VsLmZyb20ucHJldl9jbFxyXG4gICAgICAjIGZpbmQgdGhlIGZpcnN0IHNlbGVjdGlvbiB0byB0aGUgbGVmdFxyXG4gICAgICB3aGlsZSBmaXJzdF9vPyBhbmQgZmlyc3Rfby5pc0RlbGV0ZWQoKSBhbmQgbm90IGZpcnN0X28uc2VsZWN0aW9uP1xyXG4gICAgICAgIGZpcnN0X28gPSBmaXJzdF9vLnByZXZfY2xcclxuICAgICAgaWYgbm90IChmaXJzdF9vPyBhbmQgZmlyc3Rfby5zZWxlY3Rpb24/KVxyXG4gICAgICAgICMgdGhlcmUgaXMgbm8gc2VsZWN0aW9uIHRvIHRoZSBsZWZ0XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgIGVsc2VcclxuICAgICAgICBpZiBjb21wYXJlX29iamVjdHMoZmlyc3Rfby5zZWxlY3Rpb24uYXR0cnMsIHNlbC5hdHRycylcclxuICAgICAgICAgICMgd2UgYXJlIGdvaW5nIHRvIHJlbW92ZSB0aGUgbGVmdCBzZWxlY3Rpb25cclxuICAgICAgICAgICMgRmlyc3QsIHJlbW92ZSBldmVyeSB0cmFjZSBvZiBmaXJzdF9vLnNlbGVjdGlvbiAoc2F2ZSB3aGF0IGlzIG5lY2Vzc2FyeSlcclxuICAgICAgICAgICMgVGhlbiwgcmUtc2V0IHNlbC5mcm9tXHJcbiAgICAgICAgICAjXHJcbiAgICAgICAgICBuZXdfZnJvbSA9IGZpcnN0X28uc2VsZWN0aW9uLmZyb21cclxuICAgICAgICAgIEBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWUgZmlyc3Rfby5zZWxlY3Rpb25cclxuXHJcbiAgICAgICAgICBpZiBzZWwuZnJvbSBpc250IHNlbC50b1xyXG4gICAgICAgICAgICBkZWxldGUgc2VsLmZyb20uc2VsZWN0aW9uXHJcblxyXG4gICAgICAgICAgc2VsLmZyb20gPSBuZXdfZnJvbVxyXG4gICAgICAgICAgbmV3X2Zyb20uc2VsZWN0aW9uID0gc2VsXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgcmV0dXJuXHJcblxyXG4gICAgIyAzLiBleHRlbmQgLyBhZGQgc2VsZWN0aW9ucyBpbiBiZXR3ZWVuXHJcbiAgICBvID0gZnJvbVxyXG4gICAgd2hpbGUgKG8gaXNudCB0by5uZXh0X2NsKVxyXG4gICAgICBpZiBvLnNlbGVjdGlvbj9cclxuICAgICAgICAjIGp1c3QgZXh0ZW5kIHRoZSBleGlzdGluZyBzZWxlY3Rpb25cclxuICAgICAgICBleHRlbmRTZWxlY3Rpb24gby5zZWxlY3Rpb24sIGRlbHRhICMgd2lsbCBwdXNoIHVuZG8tZGVsdGFzIHRvICR1bmRvc1xyXG4gICAgICAgIHNlbGVjdGlvbiA9IG8uc2VsZWN0aW9uXHJcbiAgICAgICAgY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBzZWxlY3Rpb25cclxuXHJcbiAgICAgICAgbyA9IHNlbGVjdGlvbi50by5uZXh0X2NsXHJcbiAgICAgICAgc2VsZWN0aW9uX2lzX2VtcHR5ID0gdHJ1ZVxyXG4gICAgICAgIGZvciBhdHRyIG9mIHNlbGVjdGlvbi5hdHRyc1xyXG4gICAgICAgICAgc2VsZWN0aW9uX2lzX2VtcHR5ID0gZmFsc2VcclxuICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgaWYgc2VsZWN0aW9uX2lzX2VtcHR5XHJcbiAgICAgICAgICBAX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlIHNlbGVjdGlvblxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgIyBjcmVhdGUgYSBuZXcgc2VsZWN0aW9uICh1bnRpbCB5b3UgZmluZCB0aGUgbmV4dCBvbmUpXHJcbiAgICAgICAgc3RhcnQgPSBvXHJcbiAgICAgICAgd2hpbGUgKG5vdCBvLm5leHRfY2wuc2VsZWN0aW9uPykgYW5kIChvIGlzbnQgdG8pXHJcbiAgICAgICAgICBvID0gby5uZXh0X2NsXHJcbiAgICAgICAgZW5kID0gb1xyXG4gICAgICAgIGlmIGRlbHRhLnR5cGUgaXNudCBcInVuc2VsZWN0XCJcclxuICAgICAgICAgIGF0dHJfbGlzdCA9IFtdXHJcbiAgICAgICAgICBmb3Igbix2IG9mIGRlbHRhLmF0dHJzXHJcbiAgICAgICAgICAgIGF0dHJfbGlzdC5wdXNoIG5cclxuICAgICAgICAgIHVuZG9zLnB1c2hcclxuICAgICAgICAgICAgZnJvbTogc3RhcnRcclxuICAgICAgICAgICAgdG86IGVuZFxyXG4gICAgICAgICAgICBhdHRyczogYXR0cl9saXN0XHJcbiAgICAgICAgICAgIHR5cGU6IFwidW5zZWxlY3RcIlxyXG4gICAgICAgICAgc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIHN0YXJ0LCBlbmQsIGRlbHRhLmF0dHJzXHJcbiAgICAgICAgICBzdGFydC5zZWxlY3Rpb24gPSBzZWxlY3Rpb25cclxuICAgICAgICAgIGVuZC5zZWxlY3Rpb24gPSBzZWxlY3Rpb25cclxuICAgICAgICAgIGNvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgby5zZWxlY3Rpb25cclxuICAgICAgICBvID0gby5uZXh0X2NsXHJcblxyXG4gICAgIyBmaW5kIHRoZSBuZXh0IHNlbGVjdGlvblxyXG4gICAgd2hpbGUgby5pc0RlbGV0ZWQoKSBhbmQgKG5vdCBvLnNlbGVjdGlvbj8pXHJcbiAgICAgIG8gPSBvLm5leHRfY2xcclxuICAgICMgYW5kIGNoZWNrIGlmIHlvdSBjYW4gY29tYmluZSBpdFxyXG4gICAgaWYgby5zZWxlY3Rpb24/XHJcbiAgICAgIGNvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgby5zZWxlY3Rpb25cclxuICAgICMgYWxzbyByZS1jb25uZWN0IGZyb21cclxuICAgIGlmIGZyb20uc2VsZWN0aW9uP1xyXG4gICAgICBjb21iaW5lX3NlbGVjdGlvbl90b19sZWZ0IGZyb20uc2VsZWN0aW9uXHJcblxyXG4gICAgcmV0dXJuIGRlbHRhICMgaXQgaXMgbmVjZXNzYXJ5IHRoYXQgZGVsdGEgaXMgcmV0dXJuZWQgaW4gdGhlIHdheSBpdCB3YXMgYXBwbGllZCBvbiB0aGUgZ2xvYmFsIGRlbHRhLlxyXG4gICAgIyBzbyB0aGF0IHlqcyBrbm93cyBleGFjdGx5IHdoYXQgd2FzIGFwcGxpZWQgKGFuZCBob3cgdG8gdW5kbyBpdCkuXHJcblxyXG4gIF9yZW1vdmVGcm9tQ29tcG9zaXRpb25WYWx1ZTogKHNlbCktPlxyXG4gICAgQF9jb21wb3NpdGlvbl92YWx1ZSA9IEBfY29tcG9zaXRpb25fdmFsdWUuZmlsdGVyIChvKS0+XHJcbiAgICAgIG8gaXNudCBzZWxcclxuICAgIGRlbGV0ZSBzZWwuZnJvbS5zZWxlY3Rpb25cclxuICAgIGRlbGV0ZSBzZWwudG8uc2VsZWN0aW9uXHJcblxyXG4gICMgXCJ1bmRvXCIgYSBkZWx0YSBmcm9tIHRoZSBjb21wb3NpdGlvbl92YWx1ZVxyXG4gIF91bmFwcGx5OiAoZGVsdGFzKS0+XHJcbiAgICAjIF9hcHBseSByZXR1cm5zIGEgX2xpc3RfIG9mIGRlbHRhcywgdGhhdCBhcmUgbmVjY2Vzc2FyeSB0byB1bmRvIHRoZSBjaGFuZ2UuIE5vdyB3ZSBfYXBwbHkgZXZlcnkgZGVsdGEgaW4gdGhlIGxpc3QgKGFuZCBkaXNjYXJkIHRoZSByZXN1bHRzKVxyXG4gICAgZm9yIGRlbHRhIGluIGRlbHRhc1xyXG4gICAgICBAX2FwcGx5IGRlbHRhXHJcbiAgICByZXR1cm5cclxuXHJcbiAgIyB1cGRhdGUgdGhlIGdsb2JhbERlbHRhIHdpdGggZGVsdGFcclxuXHJcblxyXG4gICMgc2VsZWN0IF9mcm9tXywgX3RvXyB3aXRoIGFuIF9hdHRyaWJ1dGVfXHJcbiAgc2VsZWN0OiAoZnJvbSwgdG8sIGF0dHJzKS0+XHJcbiAgICBsZW5ndGggPSAwXHJcbiAgICBmb3IgYSBvZiBhdHRyc1xyXG4gICAgICBsZW5ndGgrK1xyXG4gICAgICBicmVha1xyXG4gICAgaWYgbGVuZ3RoIDw9IDBcclxuICAgICAgcmV0dXJuXHJcblxyXG4gICAgZGVsdGFfb3BlcmF0aW9ucyA9XHJcbiAgICAgIGZyb206IGZyb21cclxuICAgICAgdG86IHRvXHJcbiAgICBkZWx0YSA9XHJcbiAgICAgIGF0dHJzOiBhdHRyc1xyXG4gICAgICB0eXBlOiBcInNlbGVjdFwiXHJcblxyXG4gICAgQF9tb2RlbC5hcHBseURlbHRhKGRlbHRhLCBkZWx0YV9vcGVyYXRpb25zKVxyXG5cclxuICAjIHVuc2VsZWN0IF9mcm9tXywgX3RvXyB3aXRoIGFuIF9hdHRyaWJ1dGVfXHJcbiAgdW5zZWxlY3Q6IChmcm9tLCB0bywgYXR0cnMpLT5cclxuICAgIGlmIHR5cGVvZiBhdHRycyBpcyBcInN0cmluZ1wiXHJcbiAgICAgIGF0dHJzID0gW2F0dHJzXVxyXG4gICAgaWYgYXR0cnMuY29uc3RydWN0b3IgaXNudCBBcnJheVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJZLlNlbGVjdGlvbnMucHJvdG90eXBlLnVuc2VsZWN0IGV4cGVjdHMgYW4gQXJyYXkgb3IgU3RyaW5nIGFzIHRoZSB0aGlyZCBwYXJhbWV0ZXIgKGF0dHJpYnV0ZXMpIVwiXHJcbiAgICBpZiBhdHRycy5sZW5ndGggPD0gMFxyXG4gICAgICByZXR1cm5cclxuICAgIGRlbHRhX29wZXJhdGlvbnMgPVxyXG4gICAgICBmcm9tOiBmcm9tXHJcbiAgICAgIHRvOiB0b1xyXG4gICAgZGVsdGEgPVxyXG4gICAgICBhdHRyczogYXR0cnNcclxuICAgICAgdHlwZTogXCJ1bnNlbGVjdFwiXHJcblxyXG4gICAgQF9tb2RlbC5hcHBseURlbHRhKGRlbHRhLCBkZWx0YV9vcGVyYXRpb25zKVxyXG5cclxuICAjICogZ2V0IGFsbCB0aGUgc2VsZWN0aW9ucyBvZiBhIHktbGlzdFxyXG4gICMgKiB0aGlzIHdpbGwgYWxzbyB0ZXN0IGlmIHRoZSBzZWxlY3Rpb25zIGFyZSB3ZWxsIGZvcm1lZCAoYWZ0ZXIgJGZyb20gZm9sbG93cyAkdG8gZm9sbG93cyAkZnJvbSAuLilcclxuICBnZXRTZWxlY3Rpb25zOiAobGlzdCktPlxyXG4gICAgbyA9IGxpc3QucmVmKDApXHJcbiAgICBpZiBub3Qgbz9cclxuICAgICAgcmV0dXJuIFtdXHJcblxyXG4gICAgc2VsX3N0YXJ0ID0gbnVsbFxyXG4gICAgcG9zID0gMFxyXG4gICAgcmVzdWx0ID0gW11cclxuXHJcbiAgICB3aGlsZSBvLm5leHRfY2w/XHJcbiAgICAgIGlmIG8uaXNEZWxldGVkKClcclxuICAgICAgICBvID0gby5uZXh0X2NsXHJcbiAgICAgICAgY29udGludWVcclxuICAgICAgaWYgby5zZWxlY3Rpb24/XHJcbiAgICAgICAgaWYgby5zZWxlY3Rpb24uZnJvbSBpcyBvXHJcbiAgICAgICAgICBpZiBzZWxfc3RhcnQ/XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIkZvdW5kIHR3byBjb25zZWN1dGl2ZSBmcm9tIGVsZW1lbnRzLiBUaGUgc2VsZWN0aW9ucyBhcmUgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlISAoY29udGFjdCB0aGUgb3duZXIgb2YgdGhlIHJlcG9zaXRvcnkpXCJcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc2VsX3N0YXJ0ID0gcG9zXHJcbiAgICAgICAgaWYgby5zZWxlY3Rpb24udG8gaXMgb1xyXG4gICAgICAgICAgaWYgc2VsX3N0YXJ0P1xyXG4gICAgICAgICAgICBudW1iZXJfb2ZfYXR0cnMgPSAwXHJcbiAgICAgICAgICAgIGF0dHJzID0ge31cclxuICAgICAgICAgICAgZm9yIG4sdiBvZiBvLnNlbGVjdGlvbi5hdHRyc1xyXG4gICAgICAgICAgICAgIGF0dHJzW25dID0gdlxyXG4gICAgICAgICAgICAgIG51bWJlcl9vZl9hdHRycysrXHJcbiAgICAgICAgICAgIGlmIG51bWJlcl9vZl9hdHRycyA+IDBcclxuICAgICAgICAgICAgICByZXN1bHQucHVzaFxyXG4gICAgICAgICAgICAgICAgZnJvbTogc2VsX3N0YXJ0XHJcbiAgICAgICAgICAgICAgICB0bzogcG9zXHJcbiAgICAgICAgICAgICAgICBhdHRyczogYXR0cnNcclxuICAgICAgICAgICAgc2VsX3N0YXJ0ID0gbnVsbFxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJGb3VuZCB0d28gY29uc2VjdXRpdmUgdG8gZWxlbWVudHMuIFRoZSBzZWxlY3Rpb25zIGFyZSBubyBsb25nZXIgc2FmZSB0byB1c2UhIChjb250YWN0IHRoZSBvd25lciBvZiB0aGUgcmVwb3NpdG9yeSlcIlxyXG4gICAgICAgIGVsc2UgaWYgby5zZWxlY3Rpb24uZnJvbSBpc250IG9cclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIlRoaXMgcmVmZXJlbmNlIHNob3VsZCBub3QgcG9pbnQgdG8gdGhpcyBzZWxlY3Rpb24sIGJlY2F1c2UgdGhlIHNlbGVjdGlvbiBkb2VzIG5vdCBwb2ludCB0byB0aGUgcmVmZXJlbmNlLiBUaGUgc2VsZWN0aW9ucyBhcmUgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlISAoY29udGFjdCB0aGUgb3duZXIgb2YgdGhlIHJlcG9zaXRvcnkpXCJcclxuICAgICAgcG9zKytcclxuICAgICAgbyA9IG8ubmV4dF9jbFxyXG4gICAgcmV0dXJuIHJlc3VsdFxyXG5cclxuICBvYnNlcnZlOiAoZiktPlxyXG4gICAgQF9saXN0ZW5lcnMucHVzaCBmXHJcblxyXG4gIHVub2JzZXJ2ZTogKGYpLT5cclxuICAgIEBfbGlzdGVuZXJzID0gQF9saXN0ZW5lcnMuZmlsdGVyIChnKS0+XHJcbiAgICAgIGYgIT0gZ1xyXG5cclxuXHJcbmlmIHdpbmRvdz9cclxuICBpZiB3aW5kb3cuWT9cclxuICAgIHdpbmRvdy5ZLlNlbGVjdGlvbnMgPSBZU2VsZWN0aW9uc1xyXG4gIGVsc2VcclxuICAgIHRocm93IG5ldyBFcnJvciBcIllvdSBtdXN0IGZpcnN0IGltcG9ydCBZIVwiXHJcblxyXG5pZiBtb2R1bGU/XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBZU2VsZWN0aW9uc1xyXG4iXX0=
