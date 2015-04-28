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
    var a, attr, attr_list, createSelection, cut_off_from, cut_off_to, delta_has_attrs, end, extendSelection, from, l, n, o, o_next, observer_call, p, parent, parent_exists, selection, selection_is_empty, start, to, to_next, undos, v, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    undos = [];
    if (delta.from.isDeleted()) {
      delta.from = delta.from.getNext();
    }
    if (delta.to.isDeleted()) {
      delta.to = delta.to.getPrev();
    }
    from = delta.from;
    to = delta.to;
    if (from.getPrev() === to) {
      return undos;
    }
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
      var n, undo_attrs, undo_attrs_list, undo_need_select, undo_need_unselect, v, _k, _len2, _ref2, _ref3, _ref4;
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
        if ((delta.overwrite != null) && delta.overwrite) {
          _ref3 = selection.attrs;
          for (n in _ref3) {
            v = _ref3[n];
            if (delta.attrs[n] == null) {
              undo_need_select = true;
              undo_attrs[n] = v;
            }
          }
          for (n in undo_attrs) {
            v = undo_attrs[n];
            delete selection.attrs[n];
          }
        }
        _ref4 = delta.attrs;
        for (n in _ref4) {
          v = _ref4[n];
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
            from: selection.from,
            to: selection.to,
            attrs: undo_attrs,
            type: "select"
          });
        }
        if (undo_need_unselect) {
          return undos.push({
            from: selection.from,
            to: selection.to,
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
      o = from.getPrev();
      while ((o.selection == null) && (o.type !== "Delimiter")) {
        o = o.getPrev();
      }
      if ((o.selection == null) || o.selection.to === o) {
        return;
      }
      old_selection = o.selection;
      o = from;
      while ((o !== old_selection.to) && (o !== to)) {
        o = o.getNext();
      }
      if (o === old_selection.to) {
        new_selection = createSelection(from, old_selection.to, old_selection.attrs);
        old_selection.to = from.getPrev();
        old_selection.to.selection = old_selection;
        new_selection.from.selection = new_selection;
        return new_selection.to.selection = new_selection;
      } else {
        new_selection = createSelection(from, to, old_selection.attrs);
        opt_selection = createSelection(to.getNext(), old_selection.to, old_selection.attrs);
        old_selection.to = from.getPrev();
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
        o = o.getPrev();
      }
      if ((o.selection == null) || o.selection["to"] === o) {
        return;
      }
      old_selection = o.selection;
      new_selection = createSelection(to.getNext(), old_selection.to, old_selection.attrs);
      old_selection.to = to;
      old_selection.to.selection = old_selection;
      new_selection.from.selection = new_selection;
      return new_selection.to.selection = new_selection;
    };
    cut_off_to();
    delta_has_attrs = false;
    for (a in delta.attrs) {
      delta_has_attrs = true;
      break;
    }
    o = from;
    to_next = to.getNext();
    while (o !== to_next) {
      if (o.selection != null) {
        extendSelection(o.selection, delta);
        selection = o.selection;
        this._combine_selection_to_left(selection);
        o = selection.to.getNext();
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
        o_next = o.getNext();
        while ((o_next.selection == null) && (o !== to)) {
          o = o_next;
          o_next = o.getNext();
        }
        end = o;
        if (delta.type !== "unselect" && delta_has_attrs) {
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
        o = o.getNext();
      }
    }
    if (o.selection != null) {
      this._combine_selection_to_left(o.selection);
    }
    if (from.selection != null) {
      this._combine_selection_to_left(from.selection);
    }
    return undos;
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
    first_o = sel.from.getPrev();
    if (first_o.selection == null) {

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

  YSelections.prototype.select = function(from, to, attrs, overwrite) {
    var a, delta, delta_operations, length;
    length = 0;
    for (a in attrs) {
      length++;
      break;
    }
    if (length <= 0 && !((overwrite != null) && overwrite)) {
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
    if ((overwrite != null) && overwrite) {
      delta.overwrite = true;
    }
    return this._model.applyDelta(delta, delta_operations);
  };

  YSelections.prototype.unselectAll = function(from, to) {
    return select(from, to, {}, true);
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
          console.log("You forgot to delete the selection from this operation! Please write an issue how to reproduce this bug! (it could lead to inconsistencies!)");
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
            }
            result.push({
              from: sel_start,
              to: pos,
              attrs: attrs
            });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2Rtb25hZC9naXQveS1zZWxlY3Rpb25zL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rtb25hZC9naXQveS1zZWxlY3Rpb25zL2xpYi95LXNlbGVjdGlvbnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDRUEsSUFBQSw0QkFBQTs7QUFBQSxlQUFBLEdBQWtCLFNBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxPQUFQLEdBQUE7QUFDaEIsTUFBQSxJQUFBOztJQUR1QixVQUFRO0dBQy9CO0FBQUEsT0FBQSxNQUFBO2FBQUE7QUFDRSxJQUFBLElBQUcsQ0FBQSxDQUFLLGNBQUEsSUFBVSxDQUFFLENBQUEsQ0FBQSxDQUFGLEtBQVEsQ0FBbkIsQ0FBUDtBQUNFLGFBQU8sS0FBUCxDQURGO0tBREY7QUFBQSxHQUFBO0FBR0EsRUFBQSxJQUFHLE9BQUg7V0FDRSxlQUFBLENBQWdCLENBQWhCLEVBQWtCLENBQWxCLEVBQW9CLEtBQXBCLEVBREY7R0FBQSxNQUFBO1dBR0UsS0FIRjtHQUpnQjtBQUFBLENBQWxCLENBQUE7O0FBQUE7QUFXZSxFQUFBLHFCQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFBZCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsRUFEdEIsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxFQUhWLENBRFc7RUFBQSxDQUFiOztBQUFBLHdCQU1BLEtBQUEsR0FBTyxZQU5QLENBQUE7O0FBQUEsd0JBUUEsU0FBQSxHQUFXLFNBQUMsQ0FBRCxFQUFJLFNBQUosR0FBQTtBQUNULElBQUEsSUFBTyxtQkFBUDtBQUNFLE1BQUEsSUFBQyxDQUFBLE1BQUQsR0FBYyxJQUFBLFNBQVMsQ0FBQyxXQUFWLENBQXNCLElBQXRCLEVBQXlC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O0FBQUEsd0JBcWNBLE9BQUEsR0FBUyxTQUFDLENBQUQsR0FBQTtXQUNQLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixDQUFqQixFQURPO0VBQUEsQ0FyY1QsQ0FBQTs7QUFBQSx3QkF3Y0EsU0FBQSxHQUFXLFNBQUMsQ0FBRCxHQUFBO1dBQ1QsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosQ0FBbUIsU0FBQyxDQUFELEdBQUE7YUFDL0IsQ0FBQSxLQUFLLEVBRDBCO0lBQUEsQ0FBbkIsRUFETDtFQUFBLENBeGNYLENBQUE7O3FCQUFBOztJQVhGLENBQUE7O0FBd2RBLElBQUcsZ0RBQUg7QUFDRSxFQUFBLElBQUcsZ0JBQUg7QUFDRSxJQUFBLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVCxHQUFzQixXQUF0QixDQURGO0dBQUEsTUFBQTtBQUdFLFVBQVUsSUFBQSxLQUFBLENBQU0sMEJBQU4sQ0FBVixDQUhGO0dBREY7Q0F4ZEE7O0FBOGRBLElBQUcsZ0RBQUg7QUFDRSxFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFdBQWpCLENBREY7Q0E5ZEEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG4jIGNvbXBhcmUgdHdvIG9iamVjdCBmb3IgZXF1YWxpdHkgKG5vIGRlZXAgY2hlY2shKVxuY29tcGFyZV9vYmplY3RzID0gKG8sIHAsIGRvQWdhaW49dHJ1ZSktPlxuICBmb3Igbix2IG9mIG9cbiAgICBpZiBub3QgKHBbbl0/IGFuZCBwW25dIGlzIHYpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgaWYgZG9BZ2FpblxuICAgIGNvbXBhcmVfb2JqZWN0cyhwLG8sZmFsc2UpXG4gIGVsc2VcbiAgICB0cnVlXG5cblxuY2xhc3MgWVNlbGVjdGlvbnNcbiAgY29uc3RydWN0b3I6ICgpLT5cbiAgICBAX2xpc3RlbmVycyA9IFtdXG4gICAgQF9jb21wb3NpdGlvbl92YWx1ZSA9IFtdXG4gICAgIyB3ZSBwdXQgYWxsIHRoZSBsaXN0cyB3ZSB1c2UgaW4gdGhpcyBhcnJheVxuICAgIEBfbGlzdHMgPSBbXVxuXG4gIF9uYW1lOiBcIlNlbGVjdGlvbnNcIlxuXG4gIF9nZXRNb2RlbDogKFksIE9wZXJhdGlvbikgLT5cbiAgICBpZiBub3QgQF9tb2RlbD9cbiAgICAgIEBfbW9kZWwgPSBuZXcgT3BlcmF0aW9uLkNvbXBvc2l0aW9uKEAsIFtdKS5leGVjdXRlKClcbiAgICBAX21vZGVsXG5cbiAgX3NldE1vZGVsOiAoQF9tb2RlbCktPlxuXG4gIF9nZXRDb21wb3NpdGlvblZhbHVlOiAoKS0+XG4gICAgY29tcG9zaXRpb25fdmFsdWVfb3BlcmF0aW9ucyA9IHt9XG4gICAgY29tcG9zaXRpb25fdmFsdWUgPSBmb3IgdixpIGluIEBfY29tcG9zaXRpb25fdmFsdWVcbiAgICAgIGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnNbXCJcIitpK1wiL2Zyb21cIl0gPSB2LmZyb21cbiAgICAgIGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnNbXCJcIitpK1wiL3RvXCJdID0gdi50b1xuICAgICAge1xuICAgICAgICBhdHRyczogdi5hdHRyc1xuICAgICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBvc2l0aW9uX3ZhbHVlIDogY29tcG9zaXRpb25fdmFsdWVcbiAgICAgIGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnM6IGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnNcbiAgICB9XG5cblxuICBfc2V0Q29tcG9zaXRpb25WYWx1ZTogKGNvbXBvc2l0aW9uX3ZhbHVlKS0+XG4gICAgZm9yIHYgaW4gY29tcG9zaXRpb25fdmFsdWVcbiAgICAgIHYudHlwZSA9IFwic2VsZWN0XCJcbiAgICAgIEBfYXBwbHkgdlxuXG4gIF9hcHBseTogKGRlbHRhKS0+XG4gICAgdW5kb3MgPSBbXSAjIGxpc3Qgb2YgZGVsdGFzIHRoYXQgYXJlIG5lY2Vzc2FyeSB0byB1bmRvIHRoZSBjaGFuZ2VcblxuICAgIGlmIGRlbHRhLmZyb20uaXNEZWxldGVkKClcbiAgICAgIGRlbHRhLmZyb20gPSBkZWx0YS5mcm9tLmdldE5leHQoKVxuICAgIGlmIGRlbHRhLnRvLmlzRGVsZXRlZCgpXG4gICAgICBkZWx0YS50byA9IGRlbHRhLnRvLmdldFByZXYoKVxuXG4gICAgZnJvbSA9IGRlbHRhLmZyb21cbiAgICB0byA9IGRlbHRhLnRvXG4gICAgaWYgZnJvbS5nZXRQcmV2KCkgaXMgdG9cbiAgICAgICMgVGhlcmUgaXMgbm90aGluZyB0byBzZWxlY3QgYW55bW9yZSFcbiAgICAgIHJldHVybiB1bmRvc1xuXG5cbiAgICAjXG4gICAgIyBBc3N1bWluZyAkZnJvbSBpcyBkZWxldGVkIGF0IHNvbWUgcG9pbnQuIFdlIG5lZWQgdG8gY2hhbmdlIHRoZSBzZWxlY3Rpb25cbiAgICAjIF9iZWZvcmVfIHRoZSBHQyByZW1vdmVzIGl0IGNvbXBsZXRlbHkgZnJvbSB0aGUgbGlzdC4gVGhlcmVmb3JlLCB3ZSBsaXN0ZW4gdG9cbiAgICAjIFwiZGVsZXRlXCIgZXZlbnRzLCBhbmQgaWYgdGhhdCBwYXJ0aWN1bGFyIG9wZXJhdGlvbiBoYXMgYSBzZWxlY3Rpb25cbiAgICAjIChvLnNzZWxlY3Rpb24/KSB3ZSBtb3ZlIHRoZSBzZWxlY3Rpb24gdG8gdGhlIG5leHQgdW5kZWxldGVkIG9wZXJhdGlvbiwgaWZcbiAgICAjIGFueS4gSXQgYWxzbyBoYW5kbGVzIHRoZSBjYXNlIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBzZWxlY3QgYW55bW9yZSAoZS5nLlxuICAgICMgZXZlcnl0aGluZyBpbnNpZGUgdGhlIHNlbGVjdGlvbiBpcyBkZWxldGVkKS4gVGhlbiB3ZSByZW1vdmUgdGhlIHNlbGVjdGlvblxuICAgICMgY29tcGxldGVseVxuICAgICNcbiAgICAjIGlmIG5ldmVyIGFwcGxpZWQgYSBkZWx0YSBvbiB0aGlzIGxpc3QsIGFkZCBhIGxpc3RlbmVyIHRvIGl0IGluIG9yZGVyIHRvIGNoYW5nZSBzZWxlY3Rpb25zIGlmIG5lY2Vzc2FyeVxuICAgIGlmIGRlbHRhLnR5cGUgaXMgXCJzZWxlY3RcIlxuICAgICAgcGFyZW50ID0gZnJvbS5nZXRQYXJlbnQoKVxuICAgICAgcGFyZW50X2V4aXN0cyA9IGZhbHNlXG4gICAgICBmb3IgcCBpbiBAX2xpc3RzXG4gICAgICAgIGlmIHBhcmVudCBpcyBAX2xpc3RzW3BdXG4gICAgICAgICAgcGFyZW50X2V4aXN0cyA9IHRydWVcbiAgICAgICAgICBicmVha1xuICAgICAgaWYgbm90IHBhcmVudF9leGlzdHNcbiAgICAgICAgQF9saXN0cy5wdXNoIHBhcmVudFxuICAgICAgICBwYXJlbnQub2JzZXJ2ZSAoZXZlbnRzKT0+XG4gICAgICAgICAgZm9yIGV2ZW50IGluIGV2ZW50c1xuICAgICAgICAgICAgaWYgZXZlbnQudHlwZSBpcyBcImRlbGV0ZVwiXG4gICAgICAgICAgICAgIGlmIGV2ZW50LnJlZmVyZW5jZS5zZWxlY3Rpb24/XG4gICAgICAgICAgICAgICAgcmVmID0gZXZlbnQucmVmZXJlbmNlXG4gICAgICAgICAgICAgICAgc2VsID0gcmVmLnNlbGVjdGlvblxuICAgICAgICAgICAgICAgIGRlbGV0ZSByZWYuc2VsZWN0aW9uICMgZGVsZXRlIGl0LCBiZWNhdXNlIHJlZiBpcyBnb2luZyB0byBnZXQgZGVsZXRlZCFcbiAgICAgICAgICAgICAgICBpZiBzZWwuZnJvbSBpcyByZWYgYW5kIHNlbC50byBpcyByZWZcbiAgICAgICAgICAgICAgICAgIEBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWUgc2VsXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBzZWwuZnJvbSBpcyByZWZcbiAgICAgICAgICAgICAgICAgIHByZXYgPSByZWYuZ2V0TmV4dCgpXG4gICAgICAgICAgICAgICAgICBzZWwuZnJvbSA9IHByZXZcbiAgICAgICAgICAgICAgICAgIHByZXYuc2VsZWN0aW9uID0gc2VsXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBzZWwudG8gaXMgcmVmXG4gICAgICAgICAgICAgICAgICBuZXh0ID0gcmVmLmdldFByZXYoKVxuICAgICAgICAgICAgICAgICAgc2VsLnRvID0gbmV4dFxuICAgICAgICAgICAgICAgICAgbmV4dC5zZWxlY3Rpb24gPSBzZWxcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJGb3VuZCB3ZWlyZCBpbmNvbnNpc3RlbmN5ISBZLlNlbGVjdGlvbnMgaXMgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlIVwiXG4gICAgICAgICAgICAgIG5leHQgPSBldmVudC5yZWZlcmVuY2UuZ2V0TmV4dCgpXG4gICAgICAgICAgICAgIGlmIG5leHQuc2VsZWN0aW9uP1xuICAgICAgICAgICAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBuZXh0LnNlbGVjdGlvblxuXG4gICAgIyBub3RpZnkgbGlzdGVuZXJzOlxuICAgIG9ic2VydmVyX2NhbGwgPVxuICAgICAgZnJvbTogZnJvbVxuICAgICAgdG86IHRvXG4gICAgICB0eXBlOiBkZWx0YS50eXBlXG4gICAgICBhdHRyczogZGVsdGEuYXR0cnNcbiAgICBmb3IgbCBpbiBAX2xpc3RlbmVyc1xuICAgICAgbC5jYWxsIHRoaXMsIG9ic2VydmVyX2NhbGxcbiAgICBjcmVhdGVTZWxlY3Rpb24gPSAoZnJvbSwgdG8sIGF0dHJzKT0+XG4gICAgICBuZXdfYXR0cnMgPSB7fVxuICAgICAgZm9yIG4sdiBvZiBhdHRyc1xuICAgICAgICBuZXdfYXR0cnNbbl0gPSB2XG4gICAgICBuZXdfc2VsID0ge1xuICAgICAgICBmcm9tOiBmcm9tXG4gICAgICAgIHRvOiB0b1xuICAgICAgICBhdHRyczogbmV3X2F0dHJzXG4gICAgICB9XG4gICAgICBAX2NvbXBvc2l0aW9uX3ZhbHVlLnB1c2ggbmV3X3NlbFxuICAgICAgbmV3X3NlbFxuXG4gICAgZXh0ZW5kU2VsZWN0aW9uID0gKHNlbGVjdGlvbiktPlxuICAgICAgaWYgZGVsdGEudHlwZSBpcyBcInVuc2VsZWN0XCJcbiAgICAgICAgdW5kb19hdHRycyA9IHt9XG4gICAgICAgIGZvciBuIGluIGRlbHRhLmF0dHJzXG4gICAgICAgICAgaWYgc2VsZWN0aW9uLmF0dHJzW25dP1xuICAgICAgICAgICAgdW5kb19hdHRyc1tuXSA9IHNlbGVjdGlvbi5hdHRyc1tuXVxuICAgICAgICAgIGRlbGV0ZSBzZWxlY3Rpb24uYXR0cnNbbl1cbiAgICAgICAgdW5kb3MucHVzaFxuICAgICAgICAgIGZyb206IGRlbHRhLmZyb21cbiAgICAgICAgICB0bzogZGVsdGEudG9cbiAgICAgICAgICBhdHRyczogdW5kb19hdHRyc1xuICAgICAgICAgIHR5cGU6IFwic2VsZWN0XCJcbiAgICAgIGVsc2VcbiAgICAgICAgdW5kb19hdHRycyA9IHt9ICMgZm9yIHVuZG8gc2VsZWN0aW9uIChvdmVyd3JpdGUgb2YgZXhpc3Rpbmcgc2VsZWN0aW9uKVxuICAgICAgICB1bmRvX2F0dHJzX2xpc3QgPSBbXSAjIGZvciB1bmRvIHNlbGVjdGlvbiAobm90IG92ZXJ3cml0ZSlcbiAgICAgICAgdW5kb19uZWVkX3Vuc2VsZWN0ID0gZmFsc2VcbiAgICAgICAgdW5kb19uZWVkX3NlbGVjdCA9IGZhbHNlXG4gICAgICAgIGlmIGRlbHRhLm92ZXJ3cml0ZT8gYW5kIGRlbHRhLm92ZXJ3cml0ZVxuICAgICAgICAgICMgb3ZlcndyaXRlIGV2ZXJ5dGhpbmcgdGhhdCB0aGUgZGVsdGEgZG9lc24ndCBleHBlY3RcbiAgICAgICAgICBmb3Igbix2IG9mIHNlbGVjdGlvbi5hdHRyc1xuICAgICAgICAgICAgaWYgbm90IGRlbHRhLmF0dHJzW25dP1xuICAgICAgICAgICAgICB1bmRvX25lZWRfc2VsZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICB1bmRvX2F0dHJzW25dID0gdlxuICAgICAgICAgICAgICAjIG11c3Qgbm90IGRlbGV0ZSBhdHRyaWJ1dGVzIG9mICRzZWxlY3Rpb24uYXR0cnMgaW4gdGhpcyBsb29wLFxuICAgICAgICAgICAgICAjIHNvIHdlIGRvIGl0IGluIHRoZSBuZXh0IG9uZVxuICAgICAgICAgIGZvciBuLHYgb2YgdW5kb19hdHRyc1xuICAgICAgICAgICAgZGVsZXRlIHNlbGVjdGlvbi5hdHRyc1tuXVxuXG4gICAgICAgICMgYXBwbHkgdGhlIGRlbHRhIG9uIHRoZSBzZWxlY3Rpb25cbiAgICAgICAgZm9yIG4sdiBvZiBkZWx0YS5hdHRyc1xuICAgICAgICAgIGlmIHNlbGVjdGlvbi5hdHRyc1tuXT9cbiAgICAgICAgICAgIHVuZG9fYXR0cnNbbl0gPSBzZWxlY3Rpb24uYXR0cnNbbl1cbiAgICAgICAgICAgIHVuZG9fbmVlZF9zZWxlY3QgPSB0cnVlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdW5kb19hdHRyc19saXN0LnB1c2ggblxuICAgICAgICAgICAgdW5kb19uZWVkX3Vuc2VsZWN0ID0gdHJ1ZVxuICAgICAgICAgIHNlbGVjdGlvbi5hdHRyc1tuXSA9IHZcbiAgICAgICAgaWYgdW5kb19uZWVkX3NlbGVjdFxuICAgICAgICAgIHVuZG9zLnB1c2hcbiAgICAgICAgICAgIGZyb206IHNlbGVjdGlvbi5mcm9tXG4gICAgICAgICAgICB0bzogc2VsZWN0aW9uLnRvXG4gICAgICAgICAgICBhdHRyczogdW5kb19hdHRyc1xuICAgICAgICAgICAgdHlwZTogXCJzZWxlY3RcIlxuICAgICAgICBpZiB1bmRvX25lZWRfdW5zZWxlY3RcbiAgICAgICAgICB1bmRvcy5wdXNoXG4gICAgICAgICAgICBmcm9tOiBzZWxlY3Rpb24uZnJvbVxuICAgICAgICAgICAgdG86IHNlbGVjdGlvbi50b1xuICAgICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNfbGlzdFxuICAgICAgICAgICAgdHlwZTogXCJ1bnNlbGVjdFwiXG5cbiAgICAjIEFsZ29yaXRobSBvdmVydmlldzpcbiAgICAjIDEuIGN1dCBvZmYgdGhlIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCBmcm9tXG4gICAgIyAyLiBjdXQgb2ZmIHRoZSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggdG9cbiAgICAjIDMuIGV4dGVuZCAvIGFkZCBzZWxlY3Rpb25zIGluYmV0d2VlblxuICAgICNcbiAgICAjIyMjIDEuIGN1dCBvZmYgdGhlIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCBmcm9tXG4gICAgI1xuICAgIGN1dF9vZmZfZnJvbSA9ICgpLT5cbiAgICAgICMgY2hlY2sgaWYgYSBzZWxlY3Rpb24gKHRvIHRoZSBsZWZ0IG9mICRmcm9tKSBpbnRlcnNlY3RzIHdpdGggJGZyb21cbiAgICAgIGlmIGZyb20uc2VsZWN0aW9uPyBhbmQgZnJvbS5zZWxlY3Rpb24uZnJvbSBpcyBmcm9tXG4gICAgICAgICMgZG9lcyBub3QgaW50ZXJzZWN0LCBiZWNhdXNlIHRoZSBzdGFydCBpcyBhbHJlYWR5IHNlbGVjdGVkXG4gICAgICAgIHJldHVyblxuICAgICAgIyBmaW5kIGZpcnN0IHNlbGVjdGlvbiB0byB0aGUgbGVmdFxuICAgICAgbyA9IGZyb20uZ2V0UHJldigpXG4gICAgICB3aGlsZSAobm90IG8uc2VsZWN0aW9uPykgYW5kIChvLnR5cGUgaXNudCBcIkRlbGltaXRlclwiKVxuICAgICAgICBvID0gby5nZXRQcmV2KClcbiAgICAgIGlmIChub3Qgby5zZWxlY3Rpb24/KSBvciBvLnNlbGVjdGlvbi50byBpcyBvXG4gICAgICAgICMgbm8gaW50ZXJzZWN0aW9uXG4gICAgICAgIHJldHVyblxuICAgICAgIyBXZSBmb3VuZCBhIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCAkZnJvbS5cbiAgICAgICMgTm93IHdlIGhhdmUgdG8gY2hlY2sgaWYgaXQgYWxzbyBpbnRlcnNlY3RzIHdpdGggJHRvLlxuICAgICAgIyBUaGVuIHdlIGN1dCBpdCBpbiBzdWNoIGEgd2F5LFxuICAgICAgIyB0aGF0IHRoZSBzZWxlY3Rpb24gZG9lcyBub3QgaW50ZXJzZWN0IHdpdGggJGZyb20gYW5kICR0byBhbnltb3JlLlxuXG4gICAgICAjIHRoaXMgaXMgYSByZWZlcmVuY2UgZm9yIHRoZSBzZWxlY3Rpb25zIHRoYXQgYXJlIGNyZWF0ZWQvbW9kaWZpZWQ6XG4gICAgICAjIG9sZF9zZWxlY3Rpb24gaXMgb3V0ZXIgKG5vdCBiZXR3ZWVuICRmcm9tICR0bylcbiAgICAgICMgICAtIHdpbGwgYmUgY2hhbmdlZCBpbiBzdWNoIGEgd2F5IHRoYXQgaXQgaXMgdG8gdGhlIGxlZnQgb2YgJGZyb21cbiAgICAgICMgbmV3X3NlbGVjdGlvbiBpcyBpbm5lciAoaW5iZXR3ZWVuICRmcm9tICR0bylcbiAgICAgICMgICAtIGNyZWF0ZWQsIHJpZ2h0IGFmdGVyICRmcm9tXG4gICAgICAjIG9wdF9zZWxlY3Rpb24gaXMgb3V0ZXIgKGFmdGVyICR0bylcbiAgICAgICMgICAtIGNyZWF0ZWQgKGlmIG5lY2Vzc2FyeSksIHJpZ2h0IGFmdGVyICR0b1xuICAgICAgb2xkX3NlbGVjdGlvbiA9IG8uc2VsZWN0aW9uXG5cbiAgICAgICMgY2hlY2sgaWYgZm91bmQgc2VsZWN0aW9uIGFsc28gaW50ZXJzZWN0cyB3aXRoICR0b1xuICAgICAgIyAqIHN0YXJ0aW5nIGZyb20gJGZyb20sIGdvIHRvIHRoZSByaWdodCB1bnRpbCB5b3UgZm91bmQgZWl0aGVyICR0byBvciBvbGRfc2VsZWN0aW9uLnRvXG4gICAgICAjICoqIGlmICR0bzogbm8gaW50ZXJzZWN0aW9uIHdpdGggJHRvXG4gICAgICAjICoqIGlmICRvbGRfc2VsZWN0aW9uLnRvOiBpbnRlcnNlY3Rpb24gd2l0aCAkdG8hXG4gICAgICBvID0gZnJvbVxuICAgICAgd2hpbGUgKG8gaXNudCBvbGRfc2VsZWN0aW9uLnRvKSBhbmQgKG8gaXNudCB0bylcbiAgICAgICAgbyA9IG8uZ2V0TmV4dCgpXG5cbiAgICAgIGlmIG8gaXMgb2xkX3NlbGVjdGlvbi50b1xuICAgICAgICAjIG5vIGludGVyc2VjdGlvbiB3aXRoIHRvIVxuICAgICAgICAjIGNyZWF0ZSAkbmV3X3NlbGVjdGlvblxuICAgICAgICBuZXdfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIGZyb20sIG9sZF9zZWxlY3Rpb24udG8sIG9sZF9zZWxlY3Rpb24uYXR0cnNcblxuICAgICAgICAjIHVwZGF0ZSByZWZlcmVuY2VzXG4gICAgICAgIG9sZF9zZWxlY3Rpb24udG8gPSBmcm9tLmdldFByZXYoKVxuICAgICAgICAjIHVwZGF0ZSByZWZlcmVuY2VzIChwb2ludGVycyB0byByZXNwZWN0aXZlIHNlbGVjdGlvbnMpXG4gICAgICAgIG9sZF9zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gb2xkX3NlbGVjdGlvblxuXG4gICAgICAgIG5ld19zZWxlY3Rpb24uZnJvbS5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXG4gICAgICAgIG5ld19zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxuICAgICAgZWxzZVxuICAgICAgICAjIHRoZXJlIGlzIGFuIGludGVyc2VjdGlvbiB3aXRoIHRvIVxuXG4gICAgICAgICMgY3JlYXRlICRuZXdfc2VsZWN0aW9uXG4gICAgICAgIG5ld19zZWxlY3Rpb24gPSBjcmVhdGVTZWxlY3Rpb24gZnJvbSwgdG8sIG9sZF9zZWxlY3Rpb24uYXR0cnNcblxuICAgICAgICAjIGNyZWF0ZSAkb3B0X3NlbGVjdGlvblxuICAgICAgICBvcHRfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIHRvLmdldE5leHQoKSwgb2xkX3NlbGVjdGlvbi50bywgb2xkX3NlbGVjdGlvbi5hdHRyc1xuXG4gICAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXNcbiAgICAgICAgb2xkX3NlbGVjdGlvbi50byA9IGZyb20uZ2V0UHJldigpXG4gICAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXMgKHBvaW50ZXJzIHRvIHJlc3BlY3RpdmUgc2VsZWN0aW9ucylcbiAgICAgICAgb2xkX3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBvbGRfc2VsZWN0aW9uXG5cbiAgICAgICAgb3B0X3NlbGVjdGlvbi5mcm9tLnNlbGVjdGlvbiA9IG9wdF9zZWxlY3Rpb25cbiAgICAgICAgb3B0X3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBvcHRfc2VsZWN0aW9uXG5cbiAgICAgICAgbmV3X3NlbGVjdGlvbi5mcm9tLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cbiAgICAgICAgbmV3X3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXG5cblxuICAgIGN1dF9vZmZfZnJvbSgpXG5cbiAgICAjIDIuIGN1dCBvZmYgdGhlIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCAkdG9cbiAgICBjdXRfb2ZmX3RvID0gKCktPlxuICAgICAgIyBjaGVjayBpZiBhIHNlbGVjdGlvbiAodG8gdGhlIGxlZnQgb2YgJHRvKSBpbnRlcnNlY3RzIHdpdGggJHRvXG4gICAgICBpZiB0by5zZWxlY3Rpb24/IGFuZCB0by5zZWxlY3Rpb24udG8gaXMgdG9cbiAgICAgICAgIyBkb2VzIG5vdCBpbnRlcnNlY3QsIGJlY2F1c2UgdGhlIGVuZCBpcyBhbHJlYWR5IHNlbGVjdGVkXG4gICAgICAgIHJldHVyblxuICAgICAgIyBmaW5kIGZpcnN0IHNlbGVjdGlvbiB0byB0aGUgbGVmdFxuICAgICAgbyA9IHRvXG4gICAgICB3aGlsZSAobm90IG8uc2VsZWN0aW9uPykgYW5kIChvIGlzbnQgZnJvbSlcbiAgICAgICAgbyA9IG8uZ2V0UHJldigpXG4gICAgICBpZiAobm90IG8uc2VsZWN0aW9uPykgb3Igby5zZWxlY3Rpb25bXCJ0b1wiXSBpcyBvXG4gICAgICAgICMgbm8gaW50ZXJzZWN0aW9uXG4gICAgICAgIHJldHVyblxuICAgICAgIyBXZSBmb3VuZCBhIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCAkdG8uXG4gICAgICAjIE5vdyB3ZSBoYXZlIHRvIGN1dCBpdCBpbiBzdWNoIGEgd2F5LFxuICAgICAgIyB0aGF0IHRoZSBzZWxlY3Rpb24gZG9lcyBub3QgaW50ZXJzZWN0IHdpdGggJHRvIGFueW1vcmUuXG5cbiAgICAgICMgdGhpcyBpcyBhIHJlZmVyZW5jZSBmb3IgdGhlIHNlbGVjdGlvbnMgdGhhdCBhcmUgY3JlYXRlZC9tb2RpZmllZDpcbiAgICAgICMgaXQgaXMgc2ltaWxhciB0byB0aGUgb25lIGFib3ZlLCBleGNlcHQgdGhhdCB3ZSBkbyBub3QgbmVlZCBvcHRfc2VsZWN0aW9uIGFueW1vcmUhXG4gICAgICAjIG9sZF9zZWxlY3Rpb24gaXMgaW5uZXIgKGJldHdlZW4gJGZyb20gYW5kICR0bylcbiAgICAgICMgICAtIHdpbGwgYmUgY2hhbmdlZCBpbiBzdWNoIGEgd2F5IHRoYXQgaXQgaXMgdG8gdGhlIGxlZnQgb2YgJHRvXG4gICAgICAjIG5ld19zZWxlY3Rpb24gaXMgb3V0ZXIgKCBvdXRlciAkZnJvbSBhbmQgJHRvKVxuICAgICAgIyAgIC0gY3JlYXRlZCwgcmlnaHQgYWZ0ZXIgJHRvXG4gICAgICBvbGRfc2VsZWN0aW9uID0gby5zZWxlY3Rpb25cblxuICAgICAgIyBjcmVhdGUgJG5ld19zZWxlY3Rpb25cbiAgICAgIG5ld19zZWxlY3Rpb24gPSBjcmVhdGVTZWxlY3Rpb24gdG8uZ2V0TmV4dCgpLCBvbGRfc2VsZWN0aW9uLnRvLCBvbGRfc2VsZWN0aW9uLmF0dHJzXG5cbiAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXNcbiAgICAgIG9sZF9zZWxlY3Rpb24udG8gPSB0b1xuICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlcyAocG9pbnRlcnMgdG8gcmVzcGVjdGl2ZSBzZWxlY3Rpb25zKVxuICAgICAgb2xkX3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBvbGRfc2VsZWN0aW9uXG5cbiAgICAgIG5ld19zZWxlY3Rpb24uZnJvbS5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXG4gICAgICBuZXdfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cblxuICAgIGN1dF9vZmZfdG8oKVxuXG4gICAgZGVsdGFfaGFzX2F0dHJzID0gZmFsc2VcbiAgICBmb3IgYSBvZiBkZWx0YS5hdHRyc1xuICAgICAgZGVsdGFfaGFzX2F0dHJzID0gdHJ1ZVxuICAgICAgYnJlYWtcbiAgICAjIDMuIGV4dGVuZCAvIGFkZCBzZWxlY3Rpb25zIGluIGJldHdlZW5cbiAgICBvID0gZnJvbVxuICAgIHRvX25leHQgPSB0by5nZXROZXh0KClcbiAgICB3aGlsZSAobyBpc250IHRvX25leHQpXG4gICAgICBpZiBvLnNlbGVjdGlvbj9cbiAgICAgICAgIyBqdXN0IGV4dGVuZCB0aGUgZXhpc3Rpbmcgc2VsZWN0aW9uXG4gICAgICAgIGV4dGVuZFNlbGVjdGlvbiBvLnNlbGVjdGlvbiwgZGVsdGEgIyB3aWxsIHB1c2ggdW5kby1kZWx0YXMgdG8gJHVuZG9zXG4gICAgICAgIHNlbGVjdGlvbiA9IG8uc2VsZWN0aW9uXG4gICAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBzZWxlY3Rpb25cblxuICAgICAgICBvID0gc2VsZWN0aW9uLnRvLmdldE5leHQoKVxuICAgICAgICBzZWxlY3Rpb25faXNfZW1wdHkgPSB0cnVlXG4gICAgICAgIGZvciBhdHRyIG9mIHNlbGVjdGlvbi5hdHRyc1xuICAgICAgICAgIHNlbGVjdGlvbl9pc19lbXB0eSA9IGZhbHNlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgaWYgc2VsZWN0aW9uX2lzX2VtcHR5XG4gICAgICAgICAgQF9yZW1vdmVGcm9tQ29tcG9zaXRpb25WYWx1ZSBzZWxlY3Rpb25cbiAgICAgIGVsc2VcbiAgICAgICAgIyBjcmVhdGUgYSBuZXcgc2VsZWN0aW9uICh1bnRpbCB5b3UgZmluZCB0aGUgbmV4dCBvbmUpXG4gICAgICAgIHN0YXJ0ID0gb1xuICAgICAgICBvX25leHQgPSBvLmdldE5leHQoKVxuICAgICAgICB3aGlsZSAobm90IG9fbmV4dC5zZWxlY3Rpb24/KSBhbmQgKG8gaXNudCB0bylcbiAgICAgICAgICBvID0gb19uZXh0XG4gICAgICAgICAgb19uZXh0ID0gby5nZXROZXh0KClcbiAgICAgICAgZW5kID0gb1xuICAgICAgICBpZiBkZWx0YS50eXBlIGlzbnQgXCJ1bnNlbGVjdFwiIGFuZCBkZWx0YV9oYXNfYXR0cnNcbiAgICAgICAgICBhdHRyX2xpc3QgPSBbXVxuICAgICAgICAgIGZvciBuLHYgb2YgZGVsdGEuYXR0cnNcbiAgICAgICAgICAgIGF0dHJfbGlzdC5wdXNoIG5cbiAgICAgICAgICB1bmRvcy5wdXNoXG4gICAgICAgICAgICBmcm9tOiBzdGFydFxuICAgICAgICAgICAgdG86IGVuZFxuICAgICAgICAgICAgYXR0cnM6IGF0dHJfbGlzdFxuICAgICAgICAgICAgdHlwZTogXCJ1bnNlbGVjdFwiXG4gICAgICAgICAgc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIHN0YXJ0LCBlbmQsIGRlbHRhLmF0dHJzXG4gICAgICAgICAgc3RhcnQuc2VsZWN0aW9uID0gc2VsZWN0aW9uXG4gICAgICAgICAgZW5kLnNlbGVjdGlvbiA9IHNlbGVjdGlvblxuICAgICAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBvLnNlbGVjdGlvblxuICAgICAgICBvID0gby5nZXROZXh0KClcblxuICAgIGlmIG8uc2VsZWN0aW9uP1xuICAgICAgIyBhbmQgY2hlY2sgaWYgeW91IGNhbiBjb21iaW5lIG8uc2VsZWN0aW9uXG4gICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgby5zZWxlY3Rpb25cbiAgICAjIGFsc28gcmUtY29ubmVjdCBmcm9tXG4gICAgaWYgZnJvbS5zZWxlY3Rpb24/XG4gICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgZnJvbS5zZWxlY3Rpb25cblxuICAgIHJldHVybiB1bmRvcyAjIGl0IGlzIG5lY2Vzc2FyeSB0aGF0IGRlbHRhIGlzIHJldHVybmVkIGluIHRoZSB3YXkgaXQgd2FzIGFwcGxpZWQgb24gdGhlIGdsb2JhbCBkZWx0YS5cbiAgICAjIHNvIHRoYXQgeWpzIGtub3dzIGV4YWN0bHkgd2hhdCB3YXMgYXBwbGllZCAoYW5kIGhvdyB0byB1bmRvIGl0KS5cblxuICBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWU6IChzZWwpLT5cbiAgICBAX2NvbXBvc2l0aW9uX3ZhbHVlID0gQF9jb21wb3NpdGlvbl92YWx1ZS5maWx0ZXIgKG8pLT5cbiAgICAgIG8gaXNudCBzZWxcbiAgICBkZWxldGUgc2VsLmZyb20uc2VsZWN0aW9uXG4gICAgZGVsZXRlIHNlbC50by5zZWxlY3Rpb25cblxuICAjIHRyeSB0byBjb21iaW5lIGEgc2VsZWN0aW9uLCB0byB0aGUgc2VsZWN0aW9uIHRvIGl0cyBsZWZ0IChpZiB0aGVyZSBpcyBhbnkpXG4gIF9jb21iaW5lX3NlbGVjdGlvbl90b19sZWZ0OiAoc2VsKS0+XG4gICAgZmlyc3RfbyA9IHNlbC5mcm9tLmdldFByZXYoKVxuICAgIGlmIG5vdCBmaXJzdF9vLnNlbGVjdGlvbj9cbiAgICAgICMgdGhlcmUgaXMgbm8gc2VsZWN0aW9uIHRvIHRoZSBsZWZ0XG4gICAgICByZXR1cm5cbiAgICBlbHNlXG4gICAgICBpZiBjb21wYXJlX29iamVjdHMoZmlyc3Rfby5zZWxlY3Rpb24uYXR0cnMsIHNlbC5hdHRycylcbiAgICAgICAgIyB3ZSBhcmUgZ29pbmcgdG8gcmVtb3ZlIHRoZSBsZWZ0IHNlbGVjdGlvblxuICAgICAgICAjIEZpcnN0LCByZW1vdmUgZXZlcnkgdHJhY2Ugb2YgZmlyc3Rfby5zZWxlY3Rpb24gKHNhdmUgd2hhdCBpcyBuZWNlc3NhcnkpXG4gICAgICAgICMgVGhlbiwgcmUtc2V0IHNlbC5mcm9tXG4gICAgICAgICNcbiAgICAgICAgbmV3X2Zyb20gPSBmaXJzdF9vLnNlbGVjdGlvbi5mcm9tXG4gICAgICAgIEBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWUgZmlyc3Rfby5zZWxlY3Rpb25cblxuICAgICAgICBpZiBzZWwuZnJvbSBpc250IHNlbC50b1xuICAgICAgICAgIGRlbGV0ZSBzZWwuZnJvbS5zZWxlY3Rpb25cblxuICAgICAgICBzZWwuZnJvbSA9IG5ld19mcm9tXG4gICAgICAgIG5ld19mcm9tLnNlbGVjdGlvbiA9IHNlbFxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm5cblxuICAjIFwidW5kb1wiIGEgZGVsdGEgZnJvbSB0aGUgY29tcG9zaXRpb25fdmFsdWVcbiAgX3VuYXBwbHk6IChkZWx0YXMpLT5cbiAgICAjIF9hcHBseSByZXR1cm5zIGEgX2xpc3RfIG9mIGRlbHRhcywgdGhhdCBhcmUgbmVjY2Vzc2FyeSB0byB1bmRvIHRoZSBjaGFuZ2UuIE5vdyB3ZSBfYXBwbHkgZXZlcnkgZGVsdGEgaW4gdGhlIGxpc3QgKGFuZCBkaXNjYXJkIHRoZSByZXN1bHRzKVxuICAgIGZvciBkZWx0YSBpbiBkZWx0YXNcbiAgICAgIEBfYXBwbHkgZGVsdGFcbiAgICByZXR1cm5cblxuICAjIHVwZGF0ZSB0aGUgZ2xvYmFsRGVsdGEgd2l0aCBkZWx0YVxuXG5cbiAgIyBzZWxlY3QgX2Zyb21fLCBfdG9fIHdpdGggYW4gX2F0dHJpYnV0ZV9cbiAgc2VsZWN0OiAoZnJvbSwgdG8sIGF0dHJzLCBvdmVyd3JpdGUpLT5cbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIGEgb2YgYXR0cnNcbiAgICAgIGxlbmd0aCsrXG4gICAgICBicmVha1xuICAgIGlmIGxlbmd0aCA8PSAwIGFuZCBub3QgKG92ZXJ3cml0ZT8gYW5kIG92ZXJ3cml0ZSlcbiAgICAgIHJldHVyblxuXG4gICAgZGVsdGFfb3BlcmF0aW9ucyA9XG4gICAgICBmcm9tOiBmcm9tXG4gICAgICB0bzogdG9cblxuICAgIGRlbHRhID1cbiAgICAgIGF0dHJzOiBhdHRyc1xuICAgICAgdHlwZTogXCJzZWxlY3RcIlxuXG4gICAgaWYgb3ZlcndyaXRlPyBhbmQgb3ZlcndyaXRlXG4gICAgICBkZWx0YS5vdmVyd3JpdGUgPSB0cnVlXG5cbiAgICBAX21vZGVsLmFwcGx5RGVsdGEoZGVsdGEsIGRlbHRhX29wZXJhdGlvbnMpXG5cbiAgdW5zZWxlY3RBbGw6IChmcm9tLCB0byktPlxuICAgIHNlbGVjdCBmcm9tLCB0bywge30sIHRydWVcblxuICAjIHVuc2VsZWN0IF9mcm9tXywgX3RvXyB3aXRoIGFuIF9hdHRyaWJ1dGVfXG4gIHVuc2VsZWN0OiAoZnJvbSwgdG8sIGF0dHJzKS0+XG4gICAgaWYgdHlwZW9mIGF0dHJzIGlzIFwic3RyaW5nXCJcbiAgICAgIGF0dHJzID0gW2F0dHJzXVxuICAgIGlmIGF0dHJzLmNvbnN0cnVjdG9yIGlzbnQgQXJyYXlcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlkuU2VsZWN0aW9ucy5wcm90b3R5cGUudW5zZWxlY3QgZXhwZWN0cyBhbiBBcnJheSBvciBTdHJpbmcgYXMgdGhlIHRoaXJkIHBhcmFtZXRlciAoYXR0cmlidXRlcykhXCJcbiAgICBpZiBhdHRycy5sZW5ndGggPD0gMFxuICAgICAgcmV0dXJuXG4gICAgZGVsdGFfb3BlcmF0aW9ucyA9XG4gICAgICBmcm9tOiBmcm9tXG4gICAgICB0bzogdG9cbiAgICBkZWx0YSA9XG4gICAgICBhdHRyczogYXR0cnNcbiAgICAgIHR5cGU6IFwidW5zZWxlY3RcIlxuXG4gICAgQF9tb2RlbC5hcHBseURlbHRhKGRlbHRhLCBkZWx0YV9vcGVyYXRpb25zKVxuXG4gICMgKiBnZXQgYWxsIHRoZSBzZWxlY3Rpb25zIG9mIGEgeS1saXN0XG4gICMgKiB0aGlzIHdpbGwgYWxzbyB0ZXN0IGlmIHRoZSBzZWxlY3Rpb25zIGFyZSB3ZWxsIGZvcm1lZCAoYWZ0ZXIgJGZyb20gZm9sbG93cyAkdG8gZm9sbG93cyAkZnJvbSAuLilcbiAgZ2V0U2VsZWN0aW9uczogKGxpc3QpLT5cbiAgICBvID0gbGlzdC5yZWYoMClcbiAgICBpZiBub3Qgbz9cbiAgICAgIHJldHVybiBbXVxuXG4gICAgc2VsX3N0YXJ0ID0gbnVsbFxuICAgIHBvcyA9IDBcbiAgICByZXN1bHQgPSBbXVxuXG4gICAgd2hpbGUgby5uZXh0X2NsP1xuICAgICAgaWYgby5pc0RlbGV0ZWQoKVxuICAgICAgICBpZiBvLnNlbGVjdGlvbj9cbiAgICAgICAgICBjb25zb2xlLmxvZyBcIllvdSBmb3Jnb3QgdG8gZGVsZXRlIHRoZSBzZWxlY3Rpb24gZnJvbSB0aGlzIG9wZXJhdGlvbiEgUGxlYXNlIHdyaXRlIGFuIGlzc3VlIGhvdyB0byByZXByb2R1Y2UgdGhpcyBidWchIChpdCBjb3VsZCBsZWFkIHRvIGluY29uc2lzdGVuY2llcyEpXCJcbiAgICAgICAgbyA9IG8ubmV4dF9jbFxuICAgICAgICBjb250aW51ZVxuICAgICAgaWYgby5zZWxlY3Rpb24/XG4gICAgICAgIGlmIG8uc2VsZWN0aW9uLmZyb20gaXMgb1xuICAgICAgICAgIGlmIHNlbF9zdGFydD9cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIkZvdW5kIHR3byBjb25zZWN1dGl2ZSBmcm9tIGVsZW1lbnRzLiBUaGUgc2VsZWN0aW9ucyBhcmUgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlISAoY29udGFjdCB0aGUgb3duZXIgb2YgdGhlIHJlcG9zaXRvcnkpXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzZWxfc3RhcnQgPSBwb3NcbiAgICAgICAgaWYgby5zZWxlY3Rpb24udG8gaXMgb1xuICAgICAgICAgIGlmIHNlbF9zdGFydD9cbiAgICAgICAgICAgIG51bWJlcl9vZl9hdHRycyA9IDBcbiAgICAgICAgICAgIGF0dHJzID0ge31cbiAgICAgICAgICAgIGZvciBuLHYgb2Ygby5zZWxlY3Rpb24uYXR0cnNcbiAgICAgICAgICAgICAgYXR0cnNbbl0gPSB2XG4gICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICBmcm9tOiBzZWxfc3RhcnRcbiAgICAgICAgICAgICAgdG86IHBvc1xuICAgICAgICAgICAgICBhdHRyczogYXR0cnNcbiAgICAgICAgICAgIHNlbF9zdGFydCA9IG51bGxcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJGb3VuZCB0d28gY29uc2VjdXRpdmUgdG8gZWxlbWVudHMuIFRoZSBzZWxlY3Rpb25zIGFyZSBubyBsb25nZXIgc2FmZSB0byB1c2UhIChjb250YWN0IHRoZSBvd25lciBvZiB0aGUgcmVwb3NpdG9yeSlcIlxuICAgICAgICBlbHNlIGlmIG8uc2VsZWN0aW9uLmZyb20gaXNudCBvXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVGhpcyByZWZlcmVuY2Ugc2hvdWxkIG5vdCBwb2ludCB0byB0aGlzIHNlbGVjdGlvbiwgYmVjYXVzZSB0aGUgc2VsZWN0aW9uIGRvZXMgbm90IHBvaW50IHRvIHRoZSByZWZlcmVuY2UuIFRoZSBzZWxlY3Rpb25zIGFyZSBubyBsb25nZXIgc2FmZSB0byB1c2UhIChjb250YWN0IHRoZSBvd25lciBvZiB0aGUgcmVwb3NpdG9yeSlcIlxuICAgICAgcG9zKytcbiAgICAgIG8gPSBvLm5leHRfY2xcbiAgICByZXR1cm4gcmVzdWx0XG5cbiAgb2JzZXJ2ZTogKGYpLT5cbiAgICBAX2xpc3RlbmVycy5wdXNoIGZcblxuICB1bm9ic2VydmU6IChmKS0+XG4gICAgQF9saXN0ZW5lcnMgPSBAX2xpc3RlbmVycy5maWx0ZXIgKGcpLT5cbiAgICAgIGYgIT0gZ1xuXG5cbmlmIHdpbmRvdz9cbiAgaWYgd2luZG93Llk/XG4gICAgd2luZG93LlkuU2VsZWN0aW9ucyA9IFlTZWxlY3Rpb25zXG4gIGVsc2VcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJZb3UgbXVzdCBmaXJzdCBpbXBvcnQgWSFcIlxuXG5pZiBtb2R1bGU/XG4gIG1vZHVsZS5leHBvcnRzID0gWVNlbGVjdGlvbnNcbiJdfQ==
