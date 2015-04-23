(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var YSelections, compare_objects;

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
    var attr, attr_list, createSelection, cut_off_from, cut_off_to, end, extendSelection, from, l, n, o, observer_call, p, parent, parent_exists, selection, selection_is_empty, start, to, undos, v, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    undos = [];
    from = delta.from;
    to = delta.to;
    if (delta.type === "select") {
      parent = from.getParent();
      parent_exists = false;
      _ref = this._lists;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        if (parent === this._lists[p]) {
          parent_exists = true;
          break;
        }
      }
      if (!parent_exists) {
        this._lists.push(parent);
        parent.observe((function(_this) {
          return function(events) {
            var event, next, prev, ref, sel, _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = events.length; _j < _len1; _j++) {
              event = events[_j];
              if (event.type === "delete") {
                if (event.reference.selection != null) {
                  ref = event.reference;
                  sel = ref.selection;
                  delete ref.selection;
                  if (sel.from === ref && sel.to === ref) {
                    _this._removeFromCompositionValue(sel);
                  } else if (sel.from === ref) {
                    prev = ref.getNext();
                    sel.from = prev;
                    prev.selection = sel;
                  } else if (sel.to === ref) {
                    next = ref.getPrev();
                    sel.to = next;
                    next.selection = sel;
                  } else {
                    throw new Error("Found weird inconsistency! Y.Selections is no longer safe to use!");
                  }
                }
                next = event.reference.getNext();
                if (next.selection != null) {
                  _results.push(_this._combine_selection_to_left(next.selection));
                } else {
                  _results.push(void 0);
                }
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          };
        })(this));
      }
    }
    observer_call = {
      from: from,
      to: to,
      type: delta.type,
      attrs: delta.attrs
    };
    _ref1 = this._listeners;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      l = _ref1[_j];
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
      var n, undo_attrs, undo_attrs_list, undo_need_select, undo_need_unselect, v, _k, _len2, _ref2, _ref3;
      if (delta.type === "unselect") {
        undo_attrs = {};
        _ref2 = delta.attrs;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          n = _ref2[_k];
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
        _ref3 = delta.attrs;
        for (n in _ref3) {
          v = _ref3[n];
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
    o = from;
    while (o !== to.next_cl) {
      if (o.selection != null) {
        extendSelection(o.selection, delta);
        selection = o.selection;
        this._combine_selection_to_left(selection);
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
          _ref2 = delta.attrs;
          for (n in _ref2) {
            v = _ref2[n];
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
          this._combine_selection_to_left(o.selection);
        }
        o = o.next_cl;
      }
    }
    while (o.isDeleted() && (o.selection == null)) {
      o = o.next_cl;
    }
    if (o.selection != null) {
      this._combine_selection_to_left(o.selection);
    }
    if (from.selection != null) {
      this._combine_selection_to_left(from.selection);
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

  YSelections.prototype._combine_selection_to_left = function(sel) {
    var first_o, new_from;
    first_o = sel.from.prev_cl;
    while ((first_o != null) && first_o.isDeleted() && (first_o.selection == null)) {
      first_o = first_o.prev_cl;
    }
    if (!((first_o != null) && (first_o.selection != null))) {

    } else {
      if (compare_objects(first_o.selection.attrs, sel.attrs)) {
        new_from = first_o.selection.from;
        this._removeFromCompositionValue(first_o.selection);
        if (sel.from !== sel.to) {
          delete sel.from.selection;
        }
        sel.from = new_from;
        return new_from.selection = sel;
      } else {

      }
    }
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
        if (o.selection != null) {
          throw new Error("You forgot to delete the selection from this operation! y-selections is no longer safe to use!");
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkg6XFxHaXRIdWJcXHktc2VsZWN0aW9uc1xcbm9kZV9tb2R1bGVzXFxndWxwLWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiSDpcXEdpdEh1YlxceS1zZWxlY3Rpb25zXFxsaWJcXHktc2VsZWN0aW9ucy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNFQSxJQUFBLDRCQUFBOztBQUFBLGVBQUEsR0FBa0IsU0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLE9BQVAsR0FBQTtBQUNoQixNQUFBLElBQUE7O0lBRHVCLFVBQVE7R0FDL0I7QUFBQSxPQUFBLE1BQUE7YUFBQTtBQUNFLElBQUEsSUFBRyxDQUFBLENBQUssY0FBQSxJQUFVLENBQUUsQ0FBQSxDQUFBLENBQUYsS0FBUSxDQUFuQixDQUFQO0FBQ0UsYUFBTyxLQUFQLENBREY7S0FERjtBQUFBLEdBQUE7QUFHQSxFQUFBLElBQUcsT0FBSDtXQUNFLGVBQUEsQ0FBZ0IsQ0FBaEIsRUFBa0IsQ0FBbEIsRUFBb0IsS0FBcEIsRUFERjtHQUFBLE1BQUE7V0FHRSxLQUhGO0dBSmdCO0FBQUEsQ0FBbEIsQ0FBQTs7QUFBQTtBQVdlLEVBQUEscUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixFQUR0QixDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsTUFBRCxHQUFVLEVBSFYsQ0FEVztFQUFBLENBQWI7O0FBQUEsd0JBTUEsS0FBQSxHQUFPLFlBTlAsQ0FBQTs7QUFBQSx3QkFRQSxTQUFBLEdBQVcsU0FBQyxDQUFELEVBQUksU0FBSixHQUFBO0FBQ1QsSUFBQSxJQUFPLG1CQUFQO0FBQ0UsTUFBQSxJQUFDLENBQUEsTUFBRCxHQUFjLElBQUEsU0FBUyxDQUFDLFdBQVYsQ0FBc0IsSUFBdEIsRUFBeUIs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LE9BQUEsR0FBUyxTQUFDLENBQUQsR0FBQTtXQUNQLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixDQUFqQixFQURPO0VBQUEsQ0FqYVQsQ0FBQTs7QUFBQSx3QkFvYUEsU0FBQSxHQUFXLFNBQUMsQ0FBRCxHQUFBO1dBQ1QsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosQ0FBbUIsU0FBQyxDQUFELEdBQUE7YUFDL0IsQ0FBQSxLQUFLLEVBRDBCO0lBQUEsQ0FBbkIsRUFETDtFQUFBLENBcGFYLENBQUE7O3FCQUFBOztJQVhGLENBQUE7O0FBb2JBLElBQUcsZ0RBQUg7QUFDRSxFQUFBLElBQUcsZ0JBQUg7QUFDRSxJQUFBLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVCxHQUFzQixXQUF0QixDQURGO0dBQUEsTUFBQTtBQUdFLFVBQVUsSUFBQSxLQUFBLENBQU0sMEJBQU4sQ0FBVixDQUhGO0dBREY7Q0FwYkE7O0FBMGJBLElBQUcsZ0RBQUg7QUFDRSxFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFdBQWpCLENBREY7Q0ExYkEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXHJcbiMgY29tcGFyZSB0d28gb2JqZWN0IGZvciBlcXVhbGl0eSAobm8gZGVlcCBjaGVjayEpXHJcbmNvbXBhcmVfb2JqZWN0cyA9IChvLCBwLCBkb0FnYWluPXRydWUpLT5cclxuICBmb3Igbix2IG9mIG9cclxuICAgIGlmIG5vdCAocFtuXT8gYW5kIHBbbl0gaXMgdilcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgaWYgZG9BZ2FpblxyXG4gICAgY29tcGFyZV9vYmplY3RzKHAsbyxmYWxzZSlcclxuICBlbHNlXHJcbiAgICB0cnVlXHJcblxyXG5cclxuY2xhc3MgWVNlbGVjdGlvbnNcclxuICBjb25zdHJ1Y3RvcjogKCktPlxyXG4gICAgQF9saXN0ZW5lcnMgPSBbXVxyXG4gICAgQF9jb21wb3NpdGlvbl92YWx1ZSA9IFtdXHJcbiAgICAjIHdlIHB1dCBhbGwgdGhlIGxpc3RzIHdlIHVzZSBpbiB0aGlzIGFycmF5XHJcbiAgICBAX2xpc3RzID0gW11cclxuXHJcbiAgX25hbWU6IFwiU2VsZWN0aW9uc1wiXHJcblxyXG4gIF9nZXRNb2RlbDogKFksIE9wZXJhdGlvbikgLT5cclxuICAgIGlmIG5vdCBAX21vZGVsP1xyXG4gICAgICBAX21vZGVsID0gbmV3IE9wZXJhdGlvbi5Db21wb3NpdGlvbihALCBbXSkuZXhlY3V0ZSgpXHJcbiAgICBAX21vZGVsXHJcblxyXG4gIF9zZXRNb2RlbDogKEBfbW9kZWwpLT5cclxuXHJcbiAgX2dldENvbXBvc2l0aW9uVmFsdWU6ICgpLT5cclxuICAgIGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnMgPSB7fVxyXG4gICAgY29tcG9zaXRpb25fdmFsdWUgPSBmb3IgdixpIGluIEBfY29tcG9zaXRpb25fdmFsdWVcclxuICAgICAgY29tcG9zaXRpb25fdmFsdWVfb3BlcmF0aW9uc1tcIlwiK2krXCIvZnJvbVwiXSA9IHYuZnJvbVxyXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zW1wiXCIraStcIi90b1wiXSA9IHYudG9cclxuICAgICAge1xyXG4gICAgICAgIGF0dHJzOiB2LmF0dHJzXHJcbiAgICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZSA6IGNvbXBvc2l0aW9uX3ZhbHVlXHJcbiAgICAgIGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnM6IGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnNcclxuICAgIH1cclxuXHJcblxyXG4gIF9zZXRDb21wb3NpdGlvblZhbHVlOiAoY29tcG9zaXRpb25fdmFsdWUpLT5cclxuICAgIGZvciB2IGluIGNvbXBvc2l0aW9uX3ZhbHVlXHJcbiAgICAgIHYudHlwZSA9IFwic2VsZWN0XCJcclxuICAgICAgQF9hcHBseSB2XHJcblxyXG4gIF9hcHBseTogKGRlbHRhKS0+XHJcbiAgICB1bmRvcyA9IFtdICMgbGlzdCBvZiBkZWx0YXMgdGhhdCBhcmUgbmVjZXNzYXJ5IHRvIHVuZG8gdGhlIGNoYW5nZVxyXG4gICAgZnJvbSA9IGRlbHRhLmZyb21cclxuICAgIHRvID0gZGVsdGEudG9cclxuXHJcbiAgICAjIGlmIG5ldmVyIGFwcGxpZWQgYSBkZWx0YSBvbiB0aGlzIGxpc3QsIGFkZCBhIGxpc3RlbmVyIHRvIGl0IGluIG9yZGVyIHRvIGNoYW5nZSBzZWxlY3Rpb25zIGlmIG5lY2Vzc2FyeVxyXG4gICAgaWYgZGVsdGEudHlwZSBpcyBcInNlbGVjdFwiXHJcbiAgICAgIHBhcmVudCA9IGZyb20uZ2V0UGFyZW50KClcclxuICAgICAgcGFyZW50X2V4aXN0cyA9IGZhbHNlXHJcbiAgICAgIGZvciBwIGluIEBfbGlzdHNcclxuICAgICAgICBpZiBwYXJlbnQgaXMgQF9saXN0c1twXVxyXG4gICAgICAgICAgcGFyZW50X2V4aXN0cyA9IHRydWVcclxuICAgICAgICAgIGJyZWFrXHJcbiAgICAgIGlmIG5vdCBwYXJlbnRfZXhpc3RzXHJcbiAgICAgICAgQF9saXN0cy5wdXNoIHBhcmVudFxyXG4gICAgICAgIHBhcmVudC5vYnNlcnZlIChldmVudHMpPT5cclxuICAgICAgICAgIGZvciBldmVudCBpbiBldmVudHNcclxuICAgICAgICAgICAgaWYgZXZlbnQudHlwZSBpcyBcImRlbGV0ZVwiXHJcbiAgICAgICAgICAgICAgaWYgZXZlbnQucmVmZXJlbmNlLnNlbGVjdGlvbj9cclxuICAgICAgICAgICAgICAgIHJlZiA9IGV2ZW50LnJlZmVyZW5jZVxyXG4gICAgICAgICAgICAgICAgc2VsID0gcmVmLnNlbGVjdGlvblxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHJlZi5zZWxlY3Rpb24gIyBkZWxldGUgaXQsIGJlY2F1c2UgcmVmIGlzIGdvaW5nIHRvIGdldCBkZWxldGVkIVxyXG4gICAgICAgICAgICAgICAgaWYgc2VsLmZyb20gaXMgcmVmIGFuZCBzZWwudG8gaXMgcmVmXHJcbiAgICAgICAgICAgICAgICAgIEBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWUgc2VsXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHNlbC5mcm9tIGlzIHJlZlxyXG4gICAgICAgICAgICAgICAgICBwcmV2ID0gcmVmLmdldE5leHQoKVxyXG4gICAgICAgICAgICAgICAgICBzZWwuZnJvbSA9IHByZXZcclxuICAgICAgICAgICAgICAgICAgcHJldi5zZWxlY3Rpb24gPSBzZWxcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc2VsLnRvIGlzIHJlZlxyXG4gICAgICAgICAgICAgICAgICBuZXh0ID0gcmVmLmdldFByZXYoKVxyXG4gICAgICAgICAgICAgICAgICBzZWwudG8gPSBuZXh0XHJcbiAgICAgICAgICAgICAgICAgIG5leHQuc2VsZWN0aW9uID0gc2VsXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIkZvdW5kIHdlaXJkIGluY29uc2lzdGVuY3khIFkuU2VsZWN0aW9ucyBpcyBubyBsb25nZXIgc2FmZSB0byB1c2UhXCJcclxuICAgICAgICAgICAgICBuZXh0ID0gZXZlbnQucmVmZXJlbmNlLmdldE5leHQoKVxyXG4gICAgICAgICAgICAgIGlmIG5leHQuc2VsZWN0aW9uP1xyXG4gICAgICAgICAgICAgICAgQF9jb21iaW5lX3NlbGVjdGlvbl90b19sZWZ0IG5leHQuc2VsZWN0aW9uXHJcblxyXG4gICAgIyBub3RpZnkgbGlzdGVuZXJzOlxyXG4gICAgb2JzZXJ2ZXJfY2FsbCA9XHJcbiAgICAgIGZyb206IGZyb21cclxuICAgICAgdG86IHRvXHJcbiAgICAgIHR5cGU6IGRlbHRhLnR5cGVcclxuICAgICAgYXR0cnM6IGRlbHRhLmF0dHJzXHJcbiAgICBmb3IgbCBpbiBAX2xpc3RlbmVyc1xyXG4gICAgICBsLmNhbGwgdGhpcywgb2JzZXJ2ZXJfY2FsbFxyXG4gICAgY3JlYXRlU2VsZWN0aW9uID0gKGZyb20sIHRvLCBhdHRycyk9PlxyXG4gICAgICBuZXdfYXR0cnMgPSB7fVxyXG4gICAgICBmb3Igbix2IG9mIGF0dHJzXHJcbiAgICAgICAgbmV3X2F0dHJzW25dID0gdlxyXG4gICAgICBuZXdfc2VsID0ge1xyXG4gICAgICAgIGZyb206IGZyb21cclxuICAgICAgICB0bzogdG9cclxuICAgICAgICBhdHRyczogbmV3X2F0dHJzXHJcbiAgICAgIH1cclxuICAgICAgQF9jb21wb3NpdGlvbl92YWx1ZS5wdXNoIG5ld19zZWxcclxuICAgICAgbmV3X3NlbFxyXG5cclxuICAgIGV4dGVuZFNlbGVjdGlvbiA9IChzZWxlY3Rpb24pLT5cclxuICAgICAgaWYgZGVsdGEudHlwZSBpcyBcInVuc2VsZWN0XCJcclxuICAgICAgICB1bmRvX2F0dHJzID0ge31cclxuICAgICAgICBmb3IgbiBpbiBkZWx0YS5hdHRyc1xyXG4gICAgICAgICAgaWYgc2VsZWN0aW9uLmF0dHJzW25dP1xyXG4gICAgICAgICAgICB1bmRvX2F0dHJzW25dID0gc2VsZWN0aW9uLmF0dHJzW25dXHJcbiAgICAgICAgICBkZWxldGUgc2VsZWN0aW9uLmF0dHJzW25dXHJcbiAgICAgICAgdW5kb3MucHVzaFxyXG4gICAgICAgICAgZnJvbTogZGVsdGEuZnJvbVxyXG4gICAgICAgICAgdG86IGRlbHRhLnRvXHJcbiAgICAgICAgICBhdHRyczogdW5kb19hdHRyc1xyXG4gICAgICAgICAgdHlwZTogXCJzZWxlY3RcIlxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgdW5kb19hdHRycyA9IHt9ICMgZm9yIHVuZG8gc2VsZWN0aW9uIChvdmVyd3JpdGUgb2YgZXhpc3Rpbmcgc2VsZWN0aW9uKVxyXG4gICAgICAgIHVuZG9fYXR0cnNfbGlzdCA9IFtdICMgZm9yIHVuZG8gc2VsZWN0aW9uIChub3Qgb3ZlcndyaXRlKVxyXG4gICAgICAgIHVuZG9fbmVlZF91bnNlbGVjdCA9IGZhbHNlXHJcbiAgICAgICAgdW5kb19uZWVkX3NlbGVjdCA9IGZhbHNlXHJcbiAgICAgICAgZm9yIG4sdiBvZiBkZWx0YS5hdHRyc1xyXG4gICAgICAgICAgaWYgc2VsZWN0aW9uLmF0dHJzW25dP1xyXG4gICAgICAgICAgICB1bmRvX2F0dHJzW25dID0gc2VsZWN0aW9uLmF0dHJzW25dXHJcbiAgICAgICAgICAgIHVuZG9fbmVlZF9zZWxlY3QgPSB0cnVlXHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHVuZG9fYXR0cnNfbGlzdC5wdXNoIG5cclxuICAgICAgICAgICAgdW5kb19uZWVkX3Vuc2VsZWN0ID0gdHJ1ZVxyXG4gICAgICAgICAgc2VsZWN0aW9uLmF0dHJzW25dID0gdlxyXG4gICAgICAgIGlmIHVuZG9fbmVlZF9zZWxlY3RcclxuICAgICAgICAgIHVuZG9zLnB1c2hcclxuICAgICAgICAgICAgZnJvbTogZGVsdGEuZnJvbVxyXG4gICAgICAgICAgICB0bzogZGVsdGEudG9cclxuICAgICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNcclxuICAgICAgICAgICAgdHlwZTogXCJzZWxlY3RcIlxyXG4gICAgICAgIGlmIHVuZG9fbmVlZF91bnNlbGVjdFxyXG4gICAgICAgICAgdW5kb3MucHVzaFxyXG4gICAgICAgICAgICBmcm9tOiBkZWx0YS5mcm9tXHJcbiAgICAgICAgICAgIHRvOiBkZWx0YS50b1xyXG4gICAgICAgICAgICBhdHRyczogdW5kb19hdHRyc19saXN0XHJcbiAgICAgICAgICAgIHR5cGU6IFwidW5zZWxlY3RcIlxyXG5cclxuICAgICMgQWxnb3JpdGhtIG92ZXJ2aWV3OlxyXG4gICAgIyAxLiBjdXQgb2ZmIHRoZSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggZnJvbVxyXG4gICAgIyAyLiBjdXQgb2ZmIHRoZSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggdG9cclxuICAgICMgMy4gZXh0ZW5kIC8gYWRkIHNlbGVjdGlvbnMgaW5iZXR3ZWVuXHJcbiAgICAjXHJcbiAgICAjIyMjIDEuIGN1dCBvZmYgdGhlIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCBmcm9tXHJcbiAgICAjXHJcbiAgICBjdXRfb2ZmX2Zyb20gPSAoKS0+XHJcbiAgICAgICMgY2hlY2sgaWYgYSBzZWxlY3Rpb24gKHRvIHRoZSBsZWZ0IG9mICRmcm9tKSBpbnRlcnNlY3RzIHdpdGggJGZyb21cclxuICAgICAgaWYgZnJvbS5zZWxlY3Rpb24/IGFuZCBmcm9tLnNlbGVjdGlvbi5mcm9tIGlzIGZyb21cclxuICAgICAgICAjIGRvZXMgbm90IGludGVyc2VjdCwgYmVjYXVzZSB0aGUgc3RhcnQgaXMgYWxyZWFkeSBzZWxlY3RlZFxyXG4gICAgICAgIHJldHVyblxyXG4gICAgICAjIGZpbmQgZmlyc3Qgc2VsZWN0aW9uIHRvIHRoZSBsZWZ0XHJcbiAgICAgIG8gPSBmcm9tLnByZXZfY2xcclxuICAgICAgd2hpbGUgKG5vdCBvLnNlbGVjdGlvbj8pIGFuZCAoby50eXBlIGlzbnQgXCJEZWxpbWl0ZXJcIilcclxuICAgICAgICBvID0gby5wcmV2X2NsXHJcbiAgICAgIGlmIChub3Qgby5zZWxlY3Rpb24/KSBvciBvLnNlbGVjdGlvbi50byBpcyBvXHJcbiAgICAgICAgIyBubyBpbnRlcnNlY3Rpb25cclxuICAgICAgICByZXR1cm5cclxuICAgICAgIyBXZSBmb3VuZCBhIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCAkZnJvbS5cclxuICAgICAgIyBOb3cgd2UgaGF2ZSB0byBjaGVjayBpZiBpdCBhbHNvIGludGVyc2VjdHMgd2l0aCAkdG8uXHJcbiAgICAgICMgVGhlbiB3ZSBjdXQgaXQgaW4gc3VjaCBhIHdheSxcclxuICAgICAgIyB0aGF0IHRoZSBzZWxlY3Rpb24gZG9lcyBub3QgaW50ZXJzZWN0IHdpdGggJGZyb20gYW5kICR0byBhbnltb3JlLlxyXG5cclxuICAgICAgIyB0aGlzIGlzIGEgcmVmZXJlbmNlIGZvciB0aGUgc2VsZWN0aW9ucyB0aGF0IGFyZSBjcmVhdGVkL21vZGlmaWVkOlxyXG4gICAgICAjIG9sZF9zZWxlY3Rpb24gaXMgb3V0ZXIgKG5vdCBiZXR3ZWVuICRmcm9tICR0bylcclxuICAgICAgIyAgIC0gd2lsbCBiZSBjaGFuZ2VkIGluIHN1Y2ggYSB3YXkgdGhhdCBpdCBpcyB0byB0aGUgbGVmdCBvZiAkZnJvbVxyXG4gICAgICAjIG5ld19zZWxlY3Rpb24gaXMgaW5uZXIgKGluYmV0d2VlbiAkZnJvbSAkdG8pXHJcbiAgICAgICMgICAtIGNyZWF0ZWQsIHJpZ2h0IGFmdGVyICRmcm9tXHJcbiAgICAgICMgb3B0X3NlbGVjdGlvbiBpcyBvdXRlciAoYWZ0ZXIgJHRvKVxyXG4gICAgICAjICAgLSBjcmVhdGVkIChpZiBuZWNlc3NhcnkpLCByaWdodCBhZnRlciAkdG9cclxuICAgICAgb2xkX3NlbGVjdGlvbiA9IG8uc2VsZWN0aW9uXHJcblxyXG4gICAgICAjIGNoZWNrIGlmIGZvdW5kIHNlbGVjdGlvbiBhbHNvIGludGVyc2VjdHMgd2l0aCAkdG9cclxuICAgICAgIyAqIHN0YXJ0aW5nIGZyb20gJGZyb20sIGdvIHRvIHRoZSByaWdodCB1bnRpbCB5b3UgZm91bmQgZWl0aGVyICR0byBvciBvbGRfc2VsZWN0aW9uLnRvXHJcbiAgICAgICMgKiogaWYgJHRvOiBubyBpbnRlcnNlY3Rpb24gd2l0aCAkdG9cclxuICAgICAgIyAqKiBpZiAkb2xkX3NlbGVjdGlvbi50bzogaW50ZXJzZWN0aW9uIHdpdGggJHRvIVxyXG4gICAgICBvID0gZnJvbVxyXG4gICAgICB3aGlsZSAobyBpc250IG9sZF9zZWxlY3Rpb24udG8pIGFuZCAobyBpc250IHRvKVxyXG4gICAgICAgIG8gPSBvLm5leHRfY2xcclxuXHJcbiAgICAgIGlmIG8gaXMgb2xkX3NlbGVjdGlvbi50b1xyXG4gICAgICAgICMgbm8gaW50ZXJzZWN0aW9uIHdpdGggdG8hXHJcbiAgICAgICAgIyBjcmVhdGUgJG5ld19zZWxlY3Rpb25cclxuICAgICAgICBuZXdfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIGZyb20sIG9sZF9zZWxlY3Rpb24udG8sIG9sZF9zZWxlY3Rpb24uYXR0cnNcclxuXHJcbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlc1xyXG4gICAgICAgIG9sZF9zZWxlY3Rpb24udG8gPSBmcm9tLnByZXZfY2xcclxuICAgICAgICAjIHVwZGF0ZSByZWZlcmVuY2VzIChwb2ludGVycyB0byByZXNwZWN0aXZlIHNlbGVjdGlvbnMpXHJcbiAgICAgICAgb2xkX3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBvbGRfc2VsZWN0aW9uXHJcblxyXG4gICAgICAgIG5ld19zZWxlY3Rpb24uZnJvbS5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXHJcbiAgICAgICAgbmV3X3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXHJcbiAgICAgIGVsc2VcclxuICAgICAgICAjIHRoZXJlIGlzIGFuIGludGVyc2VjdGlvbiB3aXRoIHRvIVxyXG5cclxuICAgICAgICAjIGNyZWF0ZSAkbmV3X3NlbGVjdGlvblxyXG4gICAgICAgIG5ld19zZWxlY3Rpb24gPSBjcmVhdGVTZWxlY3Rpb24gZnJvbSwgdG8sIG9sZF9zZWxlY3Rpb24uYXR0cnNcclxuXHJcbiAgICAgICAgIyBjcmVhdGUgJG9wdF9zZWxlY3Rpb25cclxuICAgICAgICBvcHRfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIHRvLm5leHRfY2wsIG9sZF9zZWxlY3Rpb24udG8sIG9sZF9zZWxlY3Rpb24uYXR0cnNcclxuXHJcbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlc1xyXG4gICAgICAgIG9sZF9zZWxlY3Rpb24udG8gPSBmcm9tLnByZXZfY2xcclxuICAgICAgICAjIHVwZGF0ZSByZWZlcmVuY2VzIChwb2ludGVycyB0byByZXNwZWN0aXZlIHNlbGVjdGlvbnMpXHJcbiAgICAgICAgb2xkX3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBvbGRfc2VsZWN0aW9uXHJcblxyXG4gICAgICAgIG9wdF9zZWxlY3Rpb24uZnJvbS5zZWxlY3Rpb24gPSBvcHRfc2VsZWN0aW9uXHJcbiAgICAgICAgb3B0X3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBvcHRfc2VsZWN0aW9uXHJcblxyXG4gICAgICAgIG5ld19zZWxlY3Rpb24uZnJvbS5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXHJcbiAgICAgICAgbmV3X3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXHJcblxyXG5cclxuICAgIGN1dF9vZmZfZnJvbSgpXHJcblxyXG4gICAgIyAyLiBjdXQgb2ZmIHRoZSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggJHRvXHJcbiAgICBjdXRfb2ZmX3RvID0gKCktPlxyXG4gICAgICAjIGNoZWNrIGlmIGEgc2VsZWN0aW9uICh0byB0aGUgbGVmdCBvZiAkdG8pIGludGVyc2VjdHMgd2l0aCAkdG9cclxuICAgICAgaWYgdG8uc2VsZWN0aW9uPyBhbmQgdG8uc2VsZWN0aW9uLnRvIGlzIHRvXHJcbiAgICAgICAgIyBkb2VzIG5vdCBpbnRlcnNlY3QsIGJlY2F1c2UgdGhlIGVuZCBpcyBhbHJlYWR5IHNlbGVjdGVkXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgICMgZmluZCBmaXJzdCBzZWxlY3Rpb24gdG8gdGhlIGxlZnRcclxuICAgICAgbyA9IHRvXHJcbiAgICAgIHdoaWxlIChub3Qgby5zZWxlY3Rpb24/KSBhbmQgKG8gaXNudCBmcm9tKVxyXG4gICAgICAgIG8gPSBvLnByZXZfY2xcclxuICAgICAgaWYgKG5vdCBvLnNlbGVjdGlvbj8pIG9yIG8uc2VsZWN0aW9uW1widG9cIl0gaXMgb1xyXG4gICAgICAgICMgbm8gaW50ZXJzZWN0aW9uXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgICMgV2UgZm91bmQgYSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggJHRvLlxyXG4gICAgICAjIE5vdyB3ZSBoYXZlIHRvIGN1dCBpdCBpbiBzdWNoIGEgd2F5LFxyXG4gICAgICAjIHRoYXQgdGhlIHNlbGVjdGlvbiBkb2VzIG5vdCBpbnRlcnNlY3Qgd2l0aCAkdG8gYW55bW9yZS5cclxuXHJcbiAgICAgICMgdGhpcyBpcyBhIHJlZmVyZW5jZSBmb3IgdGhlIHNlbGVjdGlvbnMgdGhhdCBhcmUgY3JlYXRlZC9tb2RpZmllZDpcclxuICAgICAgIyBpdCBpcyBzaW1pbGFyIHRvIHRoZSBvbmUgYWJvdmUsIGV4Y2VwdCB0aGF0IHdlIGRvIG5vdCBuZWVkIG9wdF9zZWxlY3Rpb24gYW55bW9yZSFcclxuICAgICAgIyBvbGRfc2VsZWN0aW9uIGlzIGlubmVyIChiZXR3ZWVuICRmcm9tIGFuZCAkdG8pXHJcbiAgICAgICMgICAtIHdpbGwgYmUgY2hhbmdlZCBpbiBzdWNoIGEgd2F5IHRoYXQgaXQgaXMgdG8gdGhlIGxlZnQgb2YgJHRvXHJcbiAgICAgICMgbmV3X3NlbGVjdGlvbiBpcyBvdXRlciAoIG91dGVyICRmcm9tIGFuZCAkdG8pXHJcbiAgICAgICMgICAtIGNyZWF0ZWQsIHJpZ2h0IGFmdGVyICR0b1xyXG5cclxuICAgICAgb2xkX3NlbGVjdGlvbiA9IG8uc2VsZWN0aW9uXHJcblxyXG4gICAgICAjIGNyZWF0ZSAkbmV3X3NlbGVjdGlvblxyXG4gICAgICBuZXdfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIHRvLm5leHRfY2wsIG9sZF9zZWxlY3Rpb24udG8sIG9sZF9zZWxlY3Rpb24uYXR0cnNcclxuXHJcbiAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXNcclxuICAgICAgb2xkX3NlbGVjdGlvbi50byA9IHRvXHJcbiAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXMgKHBvaW50ZXJzIHRvIHJlc3BlY3RpdmUgc2VsZWN0aW9ucylcclxuICAgICAgb2xkX3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBvbGRfc2VsZWN0aW9uXHJcblxyXG4gICAgICBuZXdfc2VsZWN0aW9uLmZyb20uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxyXG4gICAgICBuZXdfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cclxuXHJcbiAgICBjdXRfb2ZmX3RvKClcclxuXHJcbiAgICAjIDMuIGV4dGVuZCAvIGFkZCBzZWxlY3Rpb25zIGluIGJldHdlZW5cclxuICAgIG8gPSBmcm9tXHJcbiAgICB3aGlsZSAobyBpc250IHRvLm5leHRfY2wpXHJcbiAgICAgIGlmIG8uc2VsZWN0aW9uP1xyXG4gICAgICAgICMganVzdCBleHRlbmQgdGhlIGV4aXN0aW5nIHNlbGVjdGlvblxyXG4gICAgICAgIGV4dGVuZFNlbGVjdGlvbiBvLnNlbGVjdGlvbiwgZGVsdGEgIyB3aWxsIHB1c2ggdW5kby1kZWx0YXMgdG8gJHVuZG9zXHJcbiAgICAgICAgc2VsZWN0aW9uID0gby5zZWxlY3Rpb25cclxuICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgc2VsZWN0aW9uXHJcblxyXG4gICAgICAgIG8gPSBzZWxlY3Rpb24udG8ubmV4dF9jbFxyXG4gICAgICAgIHNlbGVjdGlvbl9pc19lbXB0eSA9IHRydWVcclxuICAgICAgICBmb3IgYXR0ciBvZiBzZWxlY3Rpb24uYXR0cnNcclxuICAgICAgICAgIHNlbGVjdGlvbl9pc19lbXB0eSA9IGZhbHNlXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIGlmIHNlbGVjdGlvbl9pc19lbXB0eVxyXG4gICAgICAgICAgQF9yZW1vdmVGcm9tQ29tcG9zaXRpb25WYWx1ZSBzZWxlY3Rpb25cclxuICAgICAgZWxzZVxyXG4gICAgICAgICMgY3JlYXRlIGEgbmV3IHNlbGVjdGlvbiAodW50aWwgeW91IGZpbmQgdGhlIG5leHQgb25lKVxyXG4gICAgICAgIHN0YXJ0ID0gb1xyXG4gICAgICAgIHdoaWxlIChub3Qgby5uZXh0X2NsLnNlbGVjdGlvbj8pIGFuZCAobyBpc250IHRvKVxyXG4gICAgICAgICAgbyA9IG8ubmV4dF9jbFxyXG4gICAgICAgIGVuZCA9IG9cclxuICAgICAgICBpZiBkZWx0YS50eXBlIGlzbnQgXCJ1bnNlbGVjdFwiXHJcbiAgICAgICAgICBhdHRyX2xpc3QgPSBbXVxyXG4gICAgICAgICAgZm9yIG4sdiBvZiBkZWx0YS5hdHRyc1xyXG4gICAgICAgICAgICBhdHRyX2xpc3QucHVzaCBuXHJcbiAgICAgICAgICB1bmRvcy5wdXNoXHJcbiAgICAgICAgICAgIGZyb206IHN0YXJ0XHJcbiAgICAgICAgICAgIHRvOiBlbmRcclxuICAgICAgICAgICAgYXR0cnM6IGF0dHJfbGlzdFxyXG4gICAgICAgICAgICB0eXBlOiBcInVuc2VsZWN0XCJcclxuICAgICAgICAgIHNlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiBzdGFydCwgZW5kLCBkZWx0YS5hdHRyc1xyXG4gICAgICAgICAgc3RhcnQuc2VsZWN0aW9uID0gc2VsZWN0aW9uXHJcbiAgICAgICAgICBlbmQuc2VsZWN0aW9uID0gc2VsZWN0aW9uXHJcbiAgICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgby5zZWxlY3Rpb25cclxuICAgICAgICBvID0gby5uZXh0X2NsXHJcblxyXG4gICAgIyBmaW5kIHRoZSBuZXh0IHNlbGVjdGlvblxyXG4gICAgd2hpbGUgby5pc0RlbGV0ZWQoKSBhbmQgKG5vdCBvLnNlbGVjdGlvbj8pXHJcbiAgICAgIG8gPSBvLm5leHRfY2xcclxuICAgICMgYW5kIGNoZWNrIGlmIHlvdSBjYW4gY29tYmluZSBpdFxyXG4gICAgaWYgby5zZWxlY3Rpb24/XHJcbiAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBvLnNlbGVjdGlvblxyXG4gICAgIyBhbHNvIHJlLWNvbm5lY3QgZnJvbVxyXG4gICAgaWYgZnJvbS5zZWxlY3Rpb24/XHJcbiAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBmcm9tLnNlbGVjdGlvblxyXG5cclxuICAgIHJldHVybiBkZWx0YSAjIGl0IGlzIG5lY2Vzc2FyeSB0aGF0IGRlbHRhIGlzIHJldHVybmVkIGluIHRoZSB3YXkgaXQgd2FzIGFwcGxpZWQgb24gdGhlIGdsb2JhbCBkZWx0YS5cclxuICAgICMgc28gdGhhdCB5anMga25vd3MgZXhhY3RseSB3aGF0IHdhcyBhcHBsaWVkIChhbmQgaG93IHRvIHVuZG8gaXQpLlxyXG5cclxuICBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWU6IChzZWwpLT5cclxuICAgIEBfY29tcG9zaXRpb25fdmFsdWUgPSBAX2NvbXBvc2l0aW9uX3ZhbHVlLmZpbHRlciAobyktPlxyXG4gICAgICBvIGlzbnQgc2VsXHJcbiAgICBkZWxldGUgc2VsLmZyb20uc2VsZWN0aW9uXHJcbiAgICBkZWxldGUgc2VsLnRvLnNlbGVjdGlvblxyXG5cclxuICAjIHRyeSB0byBjb21iaW5lIGEgc2VsZWN0aW9uLCB0byB0aGUgc2VsZWN0aW9uIHRvIGl0cyBsZWZ0IChpZiB0aGVyZSBpcyBhbnkpXHJcbiAgX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQ6IChzZWwpLT5cclxuICAgIGZpcnN0X28gPSBzZWwuZnJvbS5wcmV2X2NsXHJcbiAgICAjIGZpbmQgdGhlIGZpcnN0IHNlbGVjdGlvbiB0byB0aGUgbGVmdFxyXG4gICAgd2hpbGUgZmlyc3Rfbz8gYW5kIGZpcnN0X28uaXNEZWxldGVkKCkgYW5kIG5vdCBmaXJzdF9vLnNlbGVjdGlvbj9cclxuICAgICAgZmlyc3RfbyA9IGZpcnN0X28ucHJldl9jbFxyXG4gICAgaWYgbm90IChmaXJzdF9vPyBhbmQgZmlyc3Rfby5zZWxlY3Rpb24/KVxyXG4gICAgICAjIHRoZXJlIGlzIG5vIHNlbGVjdGlvbiB0byB0aGUgbGVmdFxyXG4gICAgICByZXR1cm5cclxuICAgIGVsc2VcclxuICAgICAgaWYgY29tcGFyZV9vYmplY3RzKGZpcnN0X28uc2VsZWN0aW9uLmF0dHJzLCBzZWwuYXR0cnMpXHJcbiAgICAgICAgIyB3ZSBhcmUgZ29pbmcgdG8gcmVtb3ZlIHRoZSBsZWZ0IHNlbGVjdGlvblxyXG4gICAgICAgICMgRmlyc3QsIHJlbW92ZSBldmVyeSB0cmFjZSBvZiBmaXJzdF9vLnNlbGVjdGlvbiAoc2F2ZSB3aGF0IGlzIG5lY2Vzc2FyeSlcclxuICAgICAgICAjIFRoZW4sIHJlLXNldCBzZWwuZnJvbVxyXG4gICAgICAgICNcclxuICAgICAgICBuZXdfZnJvbSA9IGZpcnN0X28uc2VsZWN0aW9uLmZyb21cclxuICAgICAgICBAX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlIGZpcnN0X28uc2VsZWN0aW9uXHJcblxyXG4gICAgICAgIGlmIHNlbC5mcm9tIGlzbnQgc2VsLnRvXHJcbiAgICAgICAgICBkZWxldGUgc2VsLmZyb20uc2VsZWN0aW9uXHJcblxyXG4gICAgICAgIHNlbC5mcm9tID0gbmV3X2Zyb21cclxuICAgICAgICBuZXdfZnJvbS5zZWxlY3Rpb24gPSBzZWxcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHJldHVyblxyXG5cclxuICAjIFwidW5kb1wiIGEgZGVsdGEgZnJvbSB0aGUgY29tcG9zaXRpb25fdmFsdWVcclxuICBfdW5hcHBseTogKGRlbHRhcyktPlxyXG4gICAgIyBfYXBwbHkgcmV0dXJucyBhIF9saXN0XyBvZiBkZWx0YXMsIHRoYXQgYXJlIG5lY2Nlc3NhcnkgdG8gdW5kbyB0aGUgY2hhbmdlLiBOb3cgd2UgX2FwcGx5IGV2ZXJ5IGRlbHRhIGluIHRoZSBsaXN0IChhbmQgZGlzY2FyZCB0aGUgcmVzdWx0cylcclxuICAgIGZvciBkZWx0YSBpbiBkZWx0YXNcclxuICAgICAgQF9hcHBseSBkZWx0YVxyXG4gICAgcmV0dXJuXHJcblxyXG4gICMgdXBkYXRlIHRoZSBnbG9iYWxEZWx0YSB3aXRoIGRlbHRhXHJcblxyXG5cclxuICAjIHNlbGVjdCBfZnJvbV8sIF90b18gd2l0aCBhbiBfYXR0cmlidXRlX1xyXG4gIHNlbGVjdDogKGZyb20sIHRvLCBhdHRycyktPlxyXG4gICAgbGVuZ3RoID0gMFxyXG4gICAgZm9yIGEgb2YgYXR0cnNcclxuICAgICAgbGVuZ3RoKytcclxuICAgICAgYnJlYWtcclxuICAgIGlmIGxlbmd0aCA8PSAwXHJcbiAgICAgIHJldHVyblxyXG5cclxuICAgIGRlbHRhX29wZXJhdGlvbnMgPVxyXG4gICAgICBmcm9tOiBmcm9tXHJcbiAgICAgIHRvOiB0b1xyXG4gICAgZGVsdGEgPVxyXG4gICAgICBhdHRyczogYXR0cnNcclxuICAgICAgdHlwZTogXCJzZWxlY3RcIlxyXG5cclxuICAgIEBfbW9kZWwuYXBwbHlEZWx0YShkZWx0YSwgZGVsdGFfb3BlcmF0aW9ucylcclxuXHJcbiAgIyB1bnNlbGVjdCBfZnJvbV8sIF90b18gd2l0aCBhbiBfYXR0cmlidXRlX1xyXG4gIHVuc2VsZWN0OiAoZnJvbSwgdG8sIGF0dHJzKS0+XHJcbiAgICBpZiB0eXBlb2YgYXR0cnMgaXMgXCJzdHJpbmdcIlxyXG4gICAgICBhdHRycyA9IFthdHRyc11cclxuICAgIGlmIGF0dHJzLmNvbnN0cnVjdG9yIGlzbnQgQXJyYXlcclxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiWS5TZWxlY3Rpb25zLnByb3RvdHlwZS51bnNlbGVjdCBleHBlY3RzIGFuIEFycmF5IG9yIFN0cmluZyBhcyB0aGUgdGhpcmQgcGFyYW1ldGVyIChhdHRyaWJ1dGVzKSFcIlxyXG4gICAgaWYgYXR0cnMubGVuZ3RoIDw9IDBcclxuICAgICAgcmV0dXJuXHJcbiAgICBkZWx0YV9vcGVyYXRpb25zID1cclxuICAgICAgZnJvbTogZnJvbVxyXG4gICAgICB0bzogdG9cclxuICAgIGRlbHRhID1cclxuICAgICAgYXR0cnM6IGF0dHJzXHJcbiAgICAgIHR5cGU6IFwidW5zZWxlY3RcIlxyXG5cclxuICAgIEBfbW9kZWwuYXBwbHlEZWx0YShkZWx0YSwgZGVsdGFfb3BlcmF0aW9ucylcclxuXHJcbiAgIyAqIGdldCBhbGwgdGhlIHNlbGVjdGlvbnMgb2YgYSB5LWxpc3RcclxuICAjICogdGhpcyB3aWxsIGFsc28gdGVzdCBpZiB0aGUgc2VsZWN0aW9ucyBhcmUgd2VsbCBmb3JtZWQgKGFmdGVyICRmcm9tIGZvbGxvd3MgJHRvIGZvbGxvd3MgJGZyb20gLi4pXHJcbiAgZ2V0U2VsZWN0aW9uczogKGxpc3QpLT5cclxuICAgIG8gPSBsaXN0LnJlZigwKVxyXG4gICAgaWYgbm90IG8/XHJcbiAgICAgIHJldHVybiBbXVxyXG5cclxuICAgIHNlbF9zdGFydCA9IG51bGxcclxuICAgIHBvcyA9IDBcclxuICAgIHJlc3VsdCA9IFtdXHJcblxyXG4gICAgd2hpbGUgby5uZXh0X2NsP1xyXG4gICAgICBpZiBvLmlzRGVsZXRlZCgpXHJcbiAgICAgICAgaWYgby5zZWxlY3Rpb24/XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJZb3UgZm9yZ290IHRvIGRlbGV0ZSB0aGUgc2VsZWN0aW9uIGZyb20gdGhpcyBvcGVyYXRpb24hIHktc2VsZWN0aW9ucyBpcyBubyBsb25nZXIgc2FmZSB0byB1c2UhXCJcclxuICAgICAgICBvID0gby5uZXh0X2NsXHJcbiAgICAgICAgY29udGludWVcclxuICAgICAgaWYgby5zZWxlY3Rpb24/XHJcbiAgICAgICAgaWYgby5zZWxlY3Rpb24uZnJvbSBpcyBvXHJcbiAgICAgICAgICBpZiBzZWxfc3RhcnQ/XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIkZvdW5kIHR3byBjb25zZWN1dGl2ZSBmcm9tIGVsZW1lbnRzLiBUaGUgc2VsZWN0aW9ucyBhcmUgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlISAoY29udGFjdCB0aGUgb3duZXIgb2YgdGhlIHJlcG9zaXRvcnkpXCJcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc2VsX3N0YXJ0ID0gcG9zXHJcbiAgICAgICAgaWYgby5zZWxlY3Rpb24udG8gaXMgb1xyXG4gICAgICAgICAgaWYgc2VsX3N0YXJ0P1xyXG4gICAgICAgICAgICBudW1iZXJfb2ZfYXR0cnMgPSAwXHJcbiAgICAgICAgICAgIGF0dHJzID0ge31cclxuICAgICAgICAgICAgZm9yIG4sdiBvZiBvLnNlbGVjdGlvbi5hdHRyc1xyXG4gICAgICAgICAgICAgIGF0dHJzW25dID0gdlxyXG4gICAgICAgICAgICAgIG51bWJlcl9vZl9hdHRycysrXHJcbiAgICAgICAgICAgIGlmIG51bWJlcl9vZl9hdHRycyA+IDBcclxuICAgICAgICAgICAgICByZXN1bHQucHVzaFxyXG4gICAgICAgICAgICAgICAgZnJvbTogc2VsX3N0YXJ0XHJcbiAgICAgICAgICAgICAgICB0bzogcG9zXHJcbiAgICAgICAgICAgICAgICBhdHRyczogYXR0cnNcclxuICAgICAgICAgICAgc2VsX3N0YXJ0ID0gbnVsbFxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJGb3VuZCB0d28gY29uc2VjdXRpdmUgdG8gZWxlbWVudHMuIFRoZSBzZWxlY3Rpb25zIGFyZSBubyBsb25nZXIgc2FmZSB0byB1c2UhIChjb250YWN0IHRoZSBvd25lciBvZiB0aGUgcmVwb3NpdG9yeSlcIlxyXG4gICAgICAgIGVsc2UgaWYgby5zZWxlY3Rpb24uZnJvbSBpc250IG9cclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIlRoaXMgcmVmZXJlbmNlIHNob3VsZCBub3QgcG9pbnQgdG8gdGhpcyBzZWxlY3Rpb24sIGJlY2F1c2UgdGhlIHNlbGVjdGlvbiBkb2VzIG5vdCBwb2ludCB0byB0aGUgcmVmZXJlbmNlLiBUaGUgc2VsZWN0aW9ucyBhcmUgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlISAoY29udGFjdCB0aGUgb3duZXIgb2YgdGhlIHJlcG9zaXRvcnkpXCJcclxuICAgICAgcG9zKytcclxuICAgICAgbyA9IG8ubmV4dF9jbFxyXG4gICAgcmV0dXJuIHJlc3VsdFxyXG5cclxuICBvYnNlcnZlOiAoZiktPlxyXG4gICAgQF9saXN0ZW5lcnMucHVzaCBmXHJcblxyXG4gIHVub2JzZXJ2ZTogKGYpLT5cclxuICAgIEBfbGlzdGVuZXJzID0gQF9saXN0ZW5lcnMuZmlsdGVyIChnKS0+XHJcbiAgICAgIGYgIT0gZ1xyXG5cclxuXHJcbmlmIHdpbmRvdz9cclxuICBpZiB3aW5kb3cuWT9cclxuICAgIHdpbmRvdy5ZLlNlbGVjdGlvbnMgPSBZU2VsZWN0aW9uc1xyXG4gIGVsc2VcclxuICAgIHRocm93IG5ldyBFcnJvciBcIllvdSBtdXN0IGZpcnN0IGltcG9ydCBZIVwiXHJcblxyXG5pZiBtb2R1bGU/XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBZU2VsZWN0aW9uc1xyXG4iXX0=
