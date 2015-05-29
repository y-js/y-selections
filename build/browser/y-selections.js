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
        if (parent === p) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2Rtb25hZC9naXQveS1zZWxlY3Rpb25zL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rtb25hZC9naXQveS1zZWxlY3Rpb25zL2xpYi95LXNlbGVjdGlvbnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDRUEsSUFBQSw0QkFBQTs7QUFBQSxlQUFBLEdBQWtCLFNBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxPQUFQLEdBQUE7QUFDaEIsTUFBQSxJQUFBOztJQUR1QixVQUFRO0dBQy9CO0FBQUEsT0FBQSxNQUFBO2FBQUE7QUFDRSxJQUFBLElBQUcsQ0FBQSxDQUFLLGNBQUEsSUFBVSxDQUFFLENBQUEsQ0FBQSxDQUFGLEtBQVEsQ0FBbkIsQ0FBUDtBQUNFLGFBQU8sS0FBUCxDQURGO0tBREY7QUFBQSxHQUFBO0FBR0EsRUFBQSxJQUFHLE9BQUg7V0FDRSxlQUFBLENBQWdCLENBQWhCLEVBQWtCLENBQWxCLEVBQW9CLEtBQXBCLEVBREY7R0FBQSxNQUFBO1dBR0UsS0FIRjtHQUpnQjtBQUFBLENBQWxCLENBQUE7O0FBQUE7QUFXZSxFQUFBLHFCQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFBZCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsRUFEdEIsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxFQUhWLENBRFc7RUFBQSxDQUFiOztBQUFBLHdCQU1BLEtBQUEsR0FBTyxZQU5QLENBQUE7O0FBQUEsd0JBUUEsU0FBQSxHQUFXLFNBQUMsQ0FBRCxFQUFJLFNBQUosR0FBQTtBQUNULElBQUEsSUFBTyxtQkFBUDtBQUNFLE1BQUEsSUFBQyxDQUFBLE1BQUQsR0FBYyxJQUFBLFNBQVMsQ0FBQyxXQUFWLENBQXNCLElBQXRCLEVBQXlC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QyxDQUFELEdBQUE7V0FDUCxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBakIsRUFETztFQUFBLENBcmNULENBQUE7O0FBQUEsd0JBd2NBLFNBQUEsR0FBVyxTQUFDLENBQUQsR0FBQTtXQUNULElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUFaLENBQW1CLFNBQUMsQ0FBRCxHQUFBO2FBQy9CLENBQUEsS0FBSyxFQUQwQjtJQUFBLENBQW5CLEVBREw7RUFBQSxDQXhjWCxDQUFBOztxQkFBQTs7SUFYRixDQUFBOztBQXdkQSxJQUFHLGdEQUFIO0FBQ0UsRUFBQSxJQUFHLGdCQUFIO0FBQ0UsSUFBQSxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVQsR0FBc0IsV0FBdEIsQ0FERjtHQUFBLE1BQUE7QUFHRSxVQUFVLElBQUEsS0FBQSxDQUFNLDBCQUFOLENBQVYsQ0FIRjtHQURGO0NBeGRBOztBQThkQSxJQUFHLGdEQUFIO0FBQ0UsRUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQixXQUFqQixDQURGO0NBOWRBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuIyBjb21wYXJlIHR3byBvYmplY3QgZm9yIGVxdWFsaXR5IChubyBkZWVwIGNoZWNrISlcbmNvbXBhcmVfb2JqZWN0cyA9IChvLCBwLCBkb0FnYWluPXRydWUpLT5cbiAgZm9yIG4sdiBvZiBvXG4gICAgaWYgbm90IChwW25dPyBhbmQgcFtuXSBpcyB2KVxuICAgICAgcmV0dXJuIGZhbHNlXG4gIGlmIGRvQWdhaW5cbiAgICBjb21wYXJlX29iamVjdHMocCxvLGZhbHNlKVxuICBlbHNlXG4gICAgdHJ1ZVxuXG5cbmNsYXNzIFlTZWxlY3Rpb25zXG4gIGNvbnN0cnVjdG9yOiAoKS0+XG4gICAgQF9saXN0ZW5lcnMgPSBbXVxuICAgIEBfY29tcG9zaXRpb25fdmFsdWUgPSBbXVxuICAgICMgd2UgcHV0IGFsbCB0aGUgbGlzdHMgd2UgdXNlIGluIHRoaXMgYXJyYXlcbiAgICBAX2xpc3RzID0gW11cblxuICBfbmFtZTogXCJTZWxlY3Rpb25zXCJcblxuICBfZ2V0TW9kZWw6IChZLCBPcGVyYXRpb24pIC0+XG4gICAgaWYgbm90IEBfbW9kZWw/XG4gICAgICBAX21vZGVsID0gbmV3IE9wZXJhdGlvbi5Db21wb3NpdGlvbihALCBbXSkuZXhlY3V0ZSgpXG4gICAgQF9tb2RlbFxuXG4gIF9zZXRNb2RlbDogKEBfbW9kZWwpLT5cblxuICBfZ2V0Q29tcG9zaXRpb25WYWx1ZTogKCktPlxuICAgIGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnMgPSB7fVxuICAgIGNvbXBvc2l0aW9uX3ZhbHVlID0gZm9yIHYsaSBpbiBAX2NvbXBvc2l0aW9uX3ZhbHVlXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zW1wiXCIraStcIi9mcm9tXCJdID0gdi5mcm9tXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zW1wiXCIraStcIi90b1wiXSA9IHYudG9cbiAgICAgIHtcbiAgICAgICAgYXR0cnM6IHYuYXR0cnNcbiAgICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb21wb3NpdGlvbl92YWx1ZSA6IGNvbXBvc2l0aW9uX3ZhbHVlXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zOiBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zXG4gICAgfVxuXG5cbiAgX3NldENvbXBvc2l0aW9uVmFsdWU6IChjb21wb3NpdGlvbl92YWx1ZSktPlxuICAgIGZvciB2IGluIGNvbXBvc2l0aW9uX3ZhbHVlXG4gICAgICB2LnR5cGUgPSBcInNlbGVjdFwiXG4gICAgICBAX2FwcGx5IHZcblxuICBfYXBwbHk6IChkZWx0YSktPlxuICAgIHVuZG9zID0gW10gIyBsaXN0IG9mIGRlbHRhcyB0aGF0IGFyZSBuZWNlc3NhcnkgdG8gdW5kbyB0aGUgY2hhbmdlXG5cbiAgICBpZiBkZWx0YS5mcm9tLmlzRGVsZXRlZCgpXG4gICAgICBkZWx0YS5mcm9tID0gZGVsdGEuZnJvbS5nZXROZXh0KClcbiAgICBpZiBkZWx0YS50by5pc0RlbGV0ZWQoKVxuICAgICAgZGVsdGEudG8gPSBkZWx0YS50by5nZXRQcmV2KClcblxuICAgIGZyb20gPSBkZWx0YS5mcm9tXG4gICAgdG8gPSBkZWx0YS50b1xuICAgIGlmIGZyb20uZ2V0UHJldigpIGlzIHRvXG4gICAgICAjIFRoZXJlIGlzIG5vdGhpbmcgdG8gc2VsZWN0IGFueW1vcmUhXG4gICAgICByZXR1cm4gdW5kb3NcblxuXG4gICAgI1xuICAgICMgQXNzdW1pbmcgJGZyb20gaXMgZGVsZXRlZCBhdCBzb21lIHBvaW50LiBXZSBuZWVkIHRvIGNoYW5nZSB0aGUgc2VsZWN0aW9uXG4gICAgIyBfYmVmb3JlXyB0aGUgR0MgcmVtb3ZlcyBpdCBjb21wbGV0ZWx5IGZyb20gdGhlIGxpc3QuIFRoZXJlZm9yZSwgd2UgbGlzdGVuIHRvXG4gICAgIyBcImRlbGV0ZVwiIGV2ZW50cywgYW5kIGlmIHRoYXQgcGFydGljdWxhciBvcGVyYXRpb24gaGFzIGEgc2VsZWN0aW9uXG4gICAgIyAoby5zc2VsZWN0aW9uPykgd2UgbW92ZSB0aGUgc2VsZWN0aW9uIHRvIHRoZSBuZXh0IHVuZGVsZXRlZCBvcGVyYXRpb24sIGlmXG4gICAgIyBhbnkuIEl0IGFsc28gaGFuZGxlcyB0aGUgY2FzZSB0aGF0IHRoZXJlIGlzIG5vdGhpbmcgdG8gc2VsZWN0IGFueW1vcmUgKGUuZy5cbiAgICAjIGV2ZXJ5dGhpbmcgaW5zaWRlIHRoZSBzZWxlY3Rpb24gaXMgZGVsZXRlZCkuIFRoZW4gd2UgcmVtb3ZlIHRoZSBzZWxlY3Rpb25cbiAgICAjIGNvbXBsZXRlbHlcbiAgICAjXG4gICAgIyBpZiBuZXZlciBhcHBsaWVkIGEgZGVsdGEgb24gdGhpcyBsaXN0LCBhZGQgYSBsaXN0ZW5lciB0byBpdCBpbiBvcmRlciB0byBjaGFuZ2Ugc2VsZWN0aW9ucyBpZiBuZWNlc3NhcnlcbiAgICBpZiBkZWx0YS50eXBlIGlzIFwic2VsZWN0XCJcbiAgICAgIHBhcmVudCA9IGZyb20uZ2V0UGFyZW50KClcbiAgICAgIHBhcmVudF9leGlzdHMgPSBmYWxzZVxuICAgICAgZm9yIHAgaW4gQF9saXN0c1xuICAgICAgICBpZiBwYXJlbnQgaXMgcFxuICAgICAgICAgIHBhcmVudF9leGlzdHMgPSB0cnVlXG4gICAgICAgICAgYnJlYWtcbiAgICAgIGlmIG5vdCBwYXJlbnRfZXhpc3RzXG4gICAgICAgIEBfbGlzdHMucHVzaCBwYXJlbnRcbiAgICAgICAgcGFyZW50Lm9ic2VydmUgKGV2ZW50cyk9PlxuICAgICAgICAgIGZvciBldmVudCBpbiBldmVudHNcbiAgICAgICAgICAgIGlmIGV2ZW50LnR5cGUgaXMgXCJkZWxldGVcIlxuICAgICAgICAgICAgICBpZiBldmVudC5yZWZlcmVuY2Uuc2VsZWN0aW9uP1xuICAgICAgICAgICAgICAgIHJlZiA9IGV2ZW50LnJlZmVyZW5jZVxuICAgICAgICAgICAgICAgIHNlbCA9IHJlZi5zZWxlY3Rpb25cbiAgICAgICAgICAgICAgICBkZWxldGUgcmVmLnNlbGVjdGlvbiAjIGRlbGV0ZSBpdCwgYmVjYXVzZSByZWYgaXMgZ29pbmcgdG8gZ2V0IGRlbGV0ZWQhXG4gICAgICAgICAgICAgICAgaWYgc2VsLmZyb20gaXMgcmVmIGFuZCBzZWwudG8gaXMgcmVmXG4gICAgICAgICAgICAgICAgICBAX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlIHNlbFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc2VsLmZyb20gaXMgcmVmXG4gICAgICAgICAgICAgICAgICBwcmV2ID0gcmVmLmdldE5leHQoKVxuICAgICAgICAgICAgICAgICAgc2VsLmZyb20gPSBwcmV2XG4gICAgICAgICAgICAgICAgICBwcmV2LnNlbGVjdGlvbiA9IHNlbFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc2VsLnRvIGlzIHJlZlxuICAgICAgICAgICAgICAgICAgbmV4dCA9IHJlZi5nZXRQcmV2KClcbiAgICAgICAgICAgICAgICAgIHNlbC50byA9IG5leHRcbiAgICAgICAgICAgICAgICAgIG5leHQuc2VsZWN0aW9uID0gc2VsXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiRm91bmQgd2VpcmQgaW5jb25zaXN0ZW5jeSEgWS5TZWxlY3Rpb25zIGlzIG5vIGxvbmdlciBzYWZlIHRvIHVzZSFcIlxuICAgICAgICAgICAgICBuZXh0ID0gZXZlbnQucmVmZXJlbmNlLmdldE5leHQoKVxuICAgICAgICAgICAgICBpZiBuZXh0LnNlbGVjdGlvbj9cbiAgICAgICAgICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgbmV4dC5zZWxlY3Rpb25cblxuICAgICMgbm90aWZ5IGxpc3RlbmVyczpcbiAgICBvYnNlcnZlcl9jYWxsID1cbiAgICAgIGZyb206IGZyb21cbiAgICAgIHRvOiB0b1xuICAgICAgdHlwZTogZGVsdGEudHlwZVxuICAgICAgYXR0cnM6IGRlbHRhLmF0dHJzXG4gICAgZm9yIGwgaW4gQF9saXN0ZW5lcnNcbiAgICAgIGwuY2FsbCB0aGlzLCBvYnNlcnZlcl9jYWxsXG4gICAgY3JlYXRlU2VsZWN0aW9uID0gKGZyb20sIHRvLCBhdHRycyk9PlxuICAgICAgbmV3X2F0dHJzID0ge31cbiAgICAgIGZvciBuLHYgb2YgYXR0cnNcbiAgICAgICAgbmV3X2F0dHJzW25dID0gdlxuICAgICAgbmV3X3NlbCA9IHtcbiAgICAgICAgZnJvbTogZnJvbVxuICAgICAgICB0bzogdG9cbiAgICAgICAgYXR0cnM6IG5ld19hdHRyc1xuICAgICAgfVxuICAgICAgQF9jb21wb3NpdGlvbl92YWx1ZS5wdXNoIG5ld19zZWxcbiAgICAgIG5ld19zZWxcblxuICAgIGV4dGVuZFNlbGVjdGlvbiA9IChzZWxlY3Rpb24pLT5cbiAgICAgIGlmIGRlbHRhLnR5cGUgaXMgXCJ1bnNlbGVjdFwiXG4gICAgICAgIHVuZG9fYXR0cnMgPSB7fVxuICAgICAgICBmb3IgbiBpbiBkZWx0YS5hdHRyc1xuICAgICAgICAgIGlmIHNlbGVjdGlvbi5hdHRyc1tuXT9cbiAgICAgICAgICAgIHVuZG9fYXR0cnNbbl0gPSBzZWxlY3Rpb24uYXR0cnNbbl1cbiAgICAgICAgICBkZWxldGUgc2VsZWN0aW9uLmF0dHJzW25dXG4gICAgICAgIHVuZG9zLnB1c2hcbiAgICAgICAgICBmcm9tOiBkZWx0YS5mcm9tXG4gICAgICAgICAgdG86IGRlbHRhLnRvXG4gICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNcbiAgICAgICAgICB0eXBlOiBcInNlbGVjdFwiXG4gICAgICBlbHNlXG4gICAgICAgIHVuZG9fYXR0cnMgPSB7fSAjIGZvciB1bmRvIHNlbGVjdGlvbiAob3ZlcndyaXRlIG9mIGV4aXN0aW5nIHNlbGVjdGlvbilcbiAgICAgICAgdW5kb19hdHRyc19saXN0ID0gW10gIyBmb3IgdW5kbyBzZWxlY3Rpb24gKG5vdCBvdmVyd3JpdGUpXG4gICAgICAgIHVuZG9fbmVlZF91bnNlbGVjdCA9IGZhbHNlXG4gICAgICAgIHVuZG9fbmVlZF9zZWxlY3QgPSBmYWxzZVxuICAgICAgICBpZiBkZWx0YS5vdmVyd3JpdGU/IGFuZCBkZWx0YS5vdmVyd3JpdGVcbiAgICAgICAgICAjIG92ZXJ3cml0ZSBldmVyeXRoaW5nIHRoYXQgdGhlIGRlbHRhIGRvZXNuJ3QgZXhwZWN0XG4gICAgICAgICAgZm9yIG4sdiBvZiBzZWxlY3Rpb24uYXR0cnNcbiAgICAgICAgICAgIGlmIG5vdCBkZWx0YS5hdHRyc1tuXT9cbiAgICAgICAgICAgICAgdW5kb19uZWVkX3NlbGVjdCA9IHRydWVcbiAgICAgICAgICAgICAgdW5kb19hdHRyc1tuXSA9IHZcbiAgICAgICAgICAgICAgIyBtdXN0IG5vdCBkZWxldGUgYXR0cmlidXRlcyBvZiAkc2VsZWN0aW9uLmF0dHJzIGluIHRoaXMgbG9vcCxcbiAgICAgICAgICAgICAgIyBzbyB3ZSBkbyBpdCBpbiB0aGUgbmV4dCBvbmVcbiAgICAgICAgICBmb3Igbix2IG9mIHVuZG9fYXR0cnNcbiAgICAgICAgICAgIGRlbGV0ZSBzZWxlY3Rpb24uYXR0cnNbbl1cblxuICAgICAgICAjIGFwcGx5IHRoZSBkZWx0YSBvbiB0aGUgc2VsZWN0aW9uXG4gICAgICAgIGZvciBuLHYgb2YgZGVsdGEuYXR0cnNcbiAgICAgICAgICBpZiBzZWxlY3Rpb24uYXR0cnNbbl0/XG4gICAgICAgICAgICB1bmRvX2F0dHJzW25dID0gc2VsZWN0aW9uLmF0dHJzW25dXG4gICAgICAgICAgICB1bmRvX25lZWRfc2VsZWN0ID0gdHJ1ZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHVuZG9fYXR0cnNfbGlzdC5wdXNoIG5cbiAgICAgICAgICAgIHVuZG9fbmVlZF91bnNlbGVjdCA9IHRydWVcbiAgICAgICAgICBzZWxlY3Rpb24uYXR0cnNbbl0gPSB2XG4gICAgICAgIGlmIHVuZG9fbmVlZF9zZWxlY3RcbiAgICAgICAgICB1bmRvcy5wdXNoXG4gICAgICAgICAgICBmcm9tOiBzZWxlY3Rpb24uZnJvbVxuICAgICAgICAgICAgdG86IHNlbGVjdGlvbi50b1xuICAgICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNcbiAgICAgICAgICAgIHR5cGU6IFwic2VsZWN0XCJcbiAgICAgICAgaWYgdW5kb19uZWVkX3Vuc2VsZWN0XG4gICAgICAgICAgdW5kb3MucHVzaFxuICAgICAgICAgICAgZnJvbTogc2VsZWN0aW9uLmZyb21cbiAgICAgICAgICAgIHRvOiBzZWxlY3Rpb24udG9cbiAgICAgICAgICAgIGF0dHJzOiB1bmRvX2F0dHJzX2xpc3RcbiAgICAgICAgICAgIHR5cGU6IFwidW5zZWxlY3RcIlxuXG4gICAgIyBBbGdvcml0aG0gb3ZlcnZpZXc6XG4gICAgIyAxLiBjdXQgb2ZmIHRoZSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggZnJvbVxuICAgICMgMi4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoIHRvXG4gICAgIyAzLiBleHRlbmQgLyBhZGQgc2VsZWN0aW9ucyBpbmJldHdlZW5cbiAgICAjXG4gICAgIyMjIyAxLiBjdXQgb2ZmIHRoZSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggZnJvbVxuICAgICNcbiAgICBjdXRfb2ZmX2Zyb20gPSAoKS0+XG4gICAgICAjIGNoZWNrIGlmIGEgc2VsZWN0aW9uICh0byB0aGUgbGVmdCBvZiAkZnJvbSkgaW50ZXJzZWN0cyB3aXRoICRmcm9tXG4gICAgICBpZiBmcm9tLnNlbGVjdGlvbj8gYW5kIGZyb20uc2VsZWN0aW9uLmZyb20gaXMgZnJvbVxuICAgICAgICAjIGRvZXMgbm90IGludGVyc2VjdCwgYmVjYXVzZSB0aGUgc3RhcnQgaXMgYWxyZWFkeSBzZWxlY3RlZFxuICAgICAgICByZXR1cm5cbiAgICAgICMgZmluZCBmaXJzdCBzZWxlY3Rpb24gdG8gdGhlIGxlZnRcbiAgICAgIG8gPSBmcm9tLmdldFByZXYoKVxuICAgICAgd2hpbGUgKG5vdCBvLnNlbGVjdGlvbj8pIGFuZCAoby50eXBlIGlzbnQgXCJEZWxpbWl0ZXJcIilcbiAgICAgICAgbyA9IG8uZ2V0UHJldigpXG4gICAgICBpZiAobm90IG8uc2VsZWN0aW9uPykgb3Igby5zZWxlY3Rpb24udG8gaXMgb1xuICAgICAgICAjIG5vIGludGVyc2VjdGlvblxuICAgICAgICByZXR1cm5cbiAgICAgICMgV2UgZm91bmQgYSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggJGZyb20uXG4gICAgICAjIE5vdyB3ZSBoYXZlIHRvIGNoZWNrIGlmIGl0IGFsc28gaW50ZXJzZWN0cyB3aXRoICR0by5cbiAgICAgICMgVGhlbiB3ZSBjdXQgaXQgaW4gc3VjaCBhIHdheSxcbiAgICAgICMgdGhhdCB0aGUgc2VsZWN0aW9uIGRvZXMgbm90IGludGVyc2VjdCB3aXRoICRmcm9tIGFuZCAkdG8gYW55bW9yZS5cblxuICAgICAgIyB0aGlzIGlzIGEgcmVmZXJlbmNlIGZvciB0aGUgc2VsZWN0aW9ucyB0aGF0IGFyZSBjcmVhdGVkL21vZGlmaWVkOlxuICAgICAgIyBvbGRfc2VsZWN0aW9uIGlzIG91dGVyIChub3QgYmV0d2VlbiAkZnJvbSAkdG8pXG4gICAgICAjICAgLSB3aWxsIGJlIGNoYW5nZWQgaW4gc3VjaCBhIHdheSB0aGF0IGl0IGlzIHRvIHRoZSBsZWZ0IG9mICRmcm9tXG4gICAgICAjIG5ld19zZWxlY3Rpb24gaXMgaW5uZXIgKGluYmV0d2VlbiAkZnJvbSAkdG8pXG4gICAgICAjICAgLSBjcmVhdGVkLCByaWdodCBhZnRlciAkZnJvbVxuICAgICAgIyBvcHRfc2VsZWN0aW9uIGlzIG91dGVyIChhZnRlciAkdG8pXG4gICAgICAjICAgLSBjcmVhdGVkIChpZiBuZWNlc3NhcnkpLCByaWdodCBhZnRlciAkdG9cbiAgICAgIG9sZF9zZWxlY3Rpb24gPSBvLnNlbGVjdGlvblxuXG4gICAgICAjIGNoZWNrIGlmIGZvdW5kIHNlbGVjdGlvbiBhbHNvIGludGVyc2VjdHMgd2l0aCAkdG9cbiAgICAgICMgKiBzdGFydGluZyBmcm9tICRmcm9tLCBnbyB0byB0aGUgcmlnaHQgdW50aWwgeW91IGZvdW5kIGVpdGhlciAkdG8gb3Igb2xkX3NlbGVjdGlvbi50b1xuICAgICAgIyAqKiBpZiAkdG86IG5vIGludGVyc2VjdGlvbiB3aXRoICR0b1xuICAgICAgIyAqKiBpZiAkb2xkX3NlbGVjdGlvbi50bzogaW50ZXJzZWN0aW9uIHdpdGggJHRvIVxuICAgICAgbyA9IGZyb21cbiAgICAgIHdoaWxlIChvIGlzbnQgb2xkX3NlbGVjdGlvbi50bykgYW5kIChvIGlzbnQgdG8pXG4gICAgICAgIG8gPSBvLmdldE5leHQoKVxuXG4gICAgICBpZiBvIGlzIG9sZF9zZWxlY3Rpb24udG9cbiAgICAgICAgIyBubyBpbnRlcnNlY3Rpb24gd2l0aCB0byFcbiAgICAgICAgIyBjcmVhdGUgJG5ld19zZWxlY3Rpb25cbiAgICAgICAgbmV3X3NlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiBmcm9tLCBvbGRfc2VsZWN0aW9uLnRvLCBvbGRfc2VsZWN0aW9uLmF0dHJzXG5cbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlc1xuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvID0gZnJvbS5nZXRQcmV2KClcbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlcyAocG9pbnRlcnMgdG8gcmVzcGVjdGl2ZSBzZWxlY3Rpb25zKVxuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9sZF9zZWxlY3Rpb25cblxuICAgICAgICBuZXdfc2VsZWN0aW9uLmZyb20uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxuICAgICAgICBuZXdfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cbiAgICAgIGVsc2VcbiAgICAgICAgIyB0aGVyZSBpcyBhbiBpbnRlcnNlY3Rpb24gd2l0aCB0byFcblxuICAgICAgICAjIGNyZWF0ZSAkbmV3X3NlbGVjdGlvblxuICAgICAgICBuZXdfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIGZyb20sIHRvLCBvbGRfc2VsZWN0aW9uLmF0dHJzXG5cbiAgICAgICAgIyBjcmVhdGUgJG9wdF9zZWxlY3Rpb25cbiAgICAgICAgb3B0X3NlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiB0by5nZXROZXh0KCksIG9sZF9zZWxlY3Rpb24udG8sIG9sZF9zZWxlY3Rpb24uYXR0cnNcblxuICAgICAgICAjIHVwZGF0ZSByZWZlcmVuY2VzXG4gICAgICAgIG9sZF9zZWxlY3Rpb24udG8gPSBmcm9tLmdldFByZXYoKVxuICAgICAgICAjIHVwZGF0ZSByZWZlcmVuY2VzIChwb2ludGVycyB0byByZXNwZWN0aXZlIHNlbGVjdGlvbnMpXG4gICAgICAgIG9sZF9zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gb2xkX3NlbGVjdGlvblxuXG4gICAgICAgIG9wdF9zZWxlY3Rpb24uZnJvbS5zZWxlY3Rpb24gPSBvcHRfc2VsZWN0aW9uXG4gICAgICAgIG9wdF9zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gb3B0X3NlbGVjdGlvblxuXG4gICAgICAgIG5ld19zZWxlY3Rpb24uZnJvbS5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXG4gICAgICAgIG5ld19zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxuXG5cbiAgICBjdXRfb2ZmX2Zyb20oKVxuXG4gICAgIyAyLiBjdXQgb2ZmIHRoZSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggJHRvXG4gICAgY3V0X29mZl90byA9ICgpLT5cbiAgICAgICMgY2hlY2sgaWYgYSBzZWxlY3Rpb24gKHRvIHRoZSBsZWZ0IG9mICR0bykgaW50ZXJzZWN0cyB3aXRoICR0b1xuICAgICAgaWYgdG8uc2VsZWN0aW9uPyBhbmQgdG8uc2VsZWN0aW9uLnRvIGlzIHRvXG4gICAgICAgICMgZG9lcyBub3QgaW50ZXJzZWN0LCBiZWNhdXNlIHRoZSBlbmQgaXMgYWxyZWFkeSBzZWxlY3RlZFxuICAgICAgICByZXR1cm5cbiAgICAgICMgZmluZCBmaXJzdCBzZWxlY3Rpb24gdG8gdGhlIGxlZnRcbiAgICAgIG8gPSB0b1xuICAgICAgd2hpbGUgKG5vdCBvLnNlbGVjdGlvbj8pIGFuZCAobyBpc250IGZyb20pXG4gICAgICAgIG8gPSBvLmdldFByZXYoKVxuICAgICAgaWYgKG5vdCBvLnNlbGVjdGlvbj8pIG9yIG8uc2VsZWN0aW9uW1widG9cIl0gaXMgb1xuICAgICAgICAjIG5vIGludGVyc2VjdGlvblxuICAgICAgICByZXR1cm5cbiAgICAgICMgV2UgZm91bmQgYSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggJHRvLlxuICAgICAgIyBOb3cgd2UgaGF2ZSB0byBjdXQgaXQgaW4gc3VjaCBhIHdheSxcbiAgICAgICMgdGhhdCB0aGUgc2VsZWN0aW9uIGRvZXMgbm90IGludGVyc2VjdCB3aXRoICR0byBhbnltb3JlLlxuXG4gICAgICAjIHRoaXMgaXMgYSByZWZlcmVuY2UgZm9yIHRoZSBzZWxlY3Rpb25zIHRoYXQgYXJlIGNyZWF0ZWQvbW9kaWZpZWQ6XG4gICAgICAjIGl0IGlzIHNpbWlsYXIgdG8gdGhlIG9uZSBhYm92ZSwgZXhjZXB0IHRoYXQgd2UgZG8gbm90IG5lZWQgb3B0X3NlbGVjdGlvbiBhbnltb3JlIVxuICAgICAgIyBvbGRfc2VsZWN0aW9uIGlzIGlubmVyIChiZXR3ZWVuICRmcm9tIGFuZCAkdG8pXG4gICAgICAjICAgLSB3aWxsIGJlIGNoYW5nZWQgaW4gc3VjaCBhIHdheSB0aGF0IGl0IGlzIHRvIHRoZSBsZWZ0IG9mICR0b1xuICAgICAgIyBuZXdfc2VsZWN0aW9uIGlzIG91dGVyICggb3V0ZXIgJGZyb20gYW5kICR0bylcbiAgICAgICMgICAtIGNyZWF0ZWQsIHJpZ2h0IGFmdGVyICR0b1xuICAgICAgb2xkX3NlbGVjdGlvbiA9IG8uc2VsZWN0aW9uXG5cbiAgICAgICMgY3JlYXRlICRuZXdfc2VsZWN0aW9uXG4gICAgICBuZXdfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIHRvLmdldE5leHQoKSwgb2xkX3NlbGVjdGlvbi50bywgb2xkX3NlbGVjdGlvbi5hdHRyc1xuXG4gICAgICAjIHVwZGF0ZSByZWZlcmVuY2VzXG4gICAgICBvbGRfc2VsZWN0aW9uLnRvID0gdG9cbiAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXMgKHBvaW50ZXJzIHRvIHJlc3BlY3RpdmUgc2VsZWN0aW9ucylcbiAgICAgIG9sZF9zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gb2xkX3NlbGVjdGlvblxuXG4gICAgICBuZXdfc2VsZWN0aW9uLmZyb20uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxuICAgICAgbmV3X3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXG5cbiAgICBjdXRfb2ZmX3RvKClcblxuICAgIGRlbHRhX2hhc19hdHRycyA9IGZhbHNlXG4gICAgZm9yIGEgb2YgZGVsdGEuYXR0cnNcbiAgICAgIGRlbHRhX2hhc19hdHRycyA9IHRydWVcbiAgICAgIGJyZWFrXG4gICAgIyAzLiBleHRlbmQgLyBhZGQgc2VsZWN0aW9ucyBpbiBiZXR3ZWVuXG4gICAgbyA9IGZyb21cbiAgICB0b19uZXh0ID0gdG8uZ2V0TmV4dCgpXG4gICAgd2hpbGUgKG8gaXNudCB0b19uZXh0KVxuICAgICAgaWYgby5zZWxlY3Rpb24/XG4gICAgICAgICMganVzdCBleHRlbmQgdGhlIGV4aXN0aW5nIHNlbGVjdGlvblxuICAgICAgICBleHRlbmRTZWxlY3Rpb24gby5zZWxlY3Rpb24sIGRlbHRhICMgd2lsbCBwdXNoIHVuZG8tZGVsdGFzIHRvICR1bmRvc1xuICAgICAgICBzZWxlY3Rpb24gPSBvLnNlbGVjdGlvblxuICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgc2VsZWN0aW9uXG5cbiAgICAgICAgbyA9IHNlbGVjdGlvbi50by5nZXROZXh0KClcbiAgICAgICAgc2VsZWN0aW9uX2lzX2VtcHR5ID0gdHJ1ZVxuICAgICAgICBmb3IgYXR0ciBvZiBzZWxlY3Rpb24uYXR0cnNcbiAgICAgICAgICBzZWxlY3Rpb25faXNfZW1wdHkgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGlmIHNlbGVjdGlvbl9pc19lbXB0eVxuICAgICAgICAgIEBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWUgc2VsZWN0aW9uXG4gICAgICBlbHNlXG4gICAgICAgICMgY3JlYXRlIGEgbmV3IHNlbGVjdGlvbiAodW50aWwgeW91IGZpbmQgdGhlIG5leHQgb25lKVxuICAgICAgICBzdGFydCA9IG9cbiAgICAgICAgb19uZXh0ID0gby5nZXROZXh0KClcbiAgICAgICAgd2hpbGUgKG5vdCBvX25leHQuc2VsZWN0aW9uPykgYW5kIChvIGlzbnQgdG8pXG4gICAgICAgICAgbyA9IG9fbmV4dFxuICAgICAgICAgIG9fbmV4dCA9IG8uZ2V0TmV4dCgpXG4gICAgICAgIGVuZCA9IG9cbiAgICAgICAgaWYgZGVsdGEudHlwZSBpc250IFwidW5zZWxlY3RcIiBhbmQgZGVsdGFfaGFzX2F0dHJzXG4gICAgICAgICAgYXR0cl9saXN0ID0gW11cbiAgICAgICAgICBmb3Igbix2IG9mIGRlbHRhLmF0dHJzXG4gICAgICAgICAgICBhdHRyX2xpc3QucHVzaCBuXG4gICAgICAgICAgdW5kb3MucHVzaFxuICAgICAgICAgICAgZnJvbTogc3RhcnRcbiAgICAgICAgICAgIHRvOiBlbmRcbiAgICAgICAgICAgIGF0dHJzOiBhdHRyX2xpc3RcbiAgICAgICAgICAgIHR5cGU6IFwidW5zZWxlY3RcIlxuICAgICAgICAgIHNlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiBzdGFydCwgZW5kLCBkZWx0YS5hdHRyc1xuICAgICAgICAgIHN0YXJ0LnNlbGVjdGlvbiA9IHNlbGVjdGlvblxuICAgICAgICAgIGVuZC5zZWxlY3Rpb24gPSBzZWxlY3Rpb25cbiAgICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgby5zZWxlY3Rpb25cbiAgICAgICAgbyA9IG8uZ2V0TmV4dCgpXG5cbiAgICBpZiBvLnNlbGVjdGlvbj9cbiAgICAgICMgYW5kIGNoZWNrIGlmIHlvdSBjYW4gY29tYmluZSBvLnNlbGVjdGlvblxuICAgICAgQF9jb21iaW5lX3NlbGVjdGlvbl90b19sZWZ0IG8uc2VsZWN0aW9uXG4gICAgIyBhbHNvIHJlLWNvbm5lY3QgZnJvbVxuICAgIGlmIGZyb20uc2VsZWN0aW9uP1xuICAgICAgQF9jb21iaW5lX3NlbGVjdGlvbl90b19sZWZ0IGZyb20uc2VsZWN0aW9uXG5cbiAgICByZXR1cm4gdW5kb3MgIyBpdCBpcyBuZWNlc3NhcnkgdGhhdCBkZWx0YSBpcyByZXR1cm5lZCBpbiB0aGUgd2F5IGl0IHdhcyBhcHBsaWVkIG9uIHRoZSBnbG9iYWwgZGVsdGEuXG4gICAgIyBzbyB0aGF0IHlqcyBrbm93cyBleGFjdGx5IHdoYXQgd2FzIGFwcGxpZWQgKGFuZCBob3cgdG8gdW5kbyBpdCkuXG5cbiAgX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlOiAoc2VsKS0+XG4gICAgQF9jb21wb3NpdGlvbl92YWx1ZSA9IEBfY29tcG9zaXRpb25fdmFsdWUuZmlsdGVyIChvKS0+XG4gICAgICBvIGlzbnQgc2VsXG4gICAgZGVsZXRlIHNlbC5mcm9tLnNlbGVjdGlvblxuICAgIGRlbGV0ZSBzZWwudG8uc2VsZWN0aW9uXG5cbiAgIyB0cnkgdG8gY29tYmluZSBhIHNlbGVjdGlvbiwgdG8gdGhlIHNlbGVjdGlvbiB0byBpdHMgbGVmdCAoaWYgdGhlcmUgaXMgYW55KVxuICBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdDogKHNlbCktPlxuICAgIGZpcnN0X28gPSBzZWwuZnJvbS5nZXRQcmV2KClcbiAgICBpZiBub3QgZmlyc3Rfby5zZWxlY3Rpb24/XG4gICAgICAjIHRoZXJlIGlzIG5vIHNlbGVjdGlvbiB0byB0aGUgbGVmdFxuICAgICAgcmV0dXJuXG4gICAgZWxzZVxuICAgICAgaWYgY29tcGFyZV9vYmplY3RzKGZpcnN0X28uc2VsZWN0aW9uLmF0dHJzLCBzZWwuYXR0cnMpXG4gICAgICAgICMgd2UgYXJlIGdvaW5nIHRvIHJlbW92ZSB0aGUgbGVmdCBzZWxlY3Rpb25cbiAgICAgICAgIyBGaXJzdCwgcmVtb3ZlIGV2ZXJ5IHRyYWNlIG9mIGZpcnN0X28uc2VsZWN0aW9uIChzYXZlIHdoYXQgaXMgbmVjZXNzYXJ5KVxuICAgICAgICAjIFRoZW4sIHJlLXNldCBzZWwuZnJvbVxuICAgICAgICAjXG4gICAgICAgIG5ld19mcm9tID0gZmlyc3Rfby5zZWxlY3Rpb24uZnJvbVxuICAgICAgICBAX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlIGZpcnN0X28uc2VsZWN0aW9uXG5cbiAgICAgICAgaWYgc2VsLmZyb20gaXNudCBzZWwudG9cbiAgICAgICAgICBkZWxldGUgc2VsLmZyb20uc2VsZWN0aW9uXG5cbiAgICAgICAgc2VsLmZyb20gPSBuZXdfZnJvbVxuICAgICAgICBuZXdfZnJvbS5zZWxlY3Rpb24gPSBzZWxcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuXG5cbiAgIyBcInVuZG9cIiBhIGRlbHRhIGZyb20gdGhlIGNvbXBvc2l0aW9uX3ZhbHVlXG4gIF91bmFwcGx5OiAoZGVsdGFzKS0+XG4gICAgIyBfYXBwbHkgcmV0dXJucyBhIF9saXN0XyBvZiBkZWx0YXMsIHRoYXQgYXJlIG5lY2Nlc3NhcnkgdG8gdW5kbyB0aGUgY2hhbmdlLiBOb3cgd2UgX2FwcGx5IGV2ZXJ5IGRlbHRhIGluIHRoZSBsaXN0IChhbmQgZGlzY2FyZCB0aGUgcmVzdWx0cylcbiAgICBmb3IgZGVsdGEgaW4gZGVsdGFzXG4gICAgICBAX2FwcGx5IGRlbHRhXG4gICAgcmV0dXJuXG5cbiAgIyB1cGRhdGUgdGhlIGdsb2JhbERlbHRhIHdpdGggZGVsdGFcblxuXG4gICMgc2VsZWN0IF9mcm9tXywgX3RvXyB3aXRoIGFuIF9hdHRyaWJ1dGVfXG4gIHNlbGVjdDogKGZyb20sIHRvLCBhdHRycywgb3ZlcndyaXRlKS0+XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciBhIG9mIGF0dHJzXG4gICAgICBsZW5ndGgrK1xuICAgICAgYnJlYWtcbiAgICBpZiBsZW5ndGggPD0gMCBhbmQgbm90IChvdmVyd3JpdGU/IGFuZCBvdmVyd3JpdGUpXG4gICAgICByZXR1cm5cblxuICAgIGRlbHRhX29wZXJhdGlvbnMgPVxuICAgICAgZnJvbTogZnJvbVxuICAgICAgdG86IHRvXG5cbiAgICBkZWx0YSA9XG4gICAgICBhdHRyczogYXR0cnNcbiAgICAgIHR5cGU6IFwic2VsZWN0XCJcblxuICAgIGlmIG92ZXJ3cml0ZT8gYW5kIG92ZXJ3cml0ZVxuICAgICAgZGVsdGEub3ZlcndyaXRlID0gdHJ1ZVxuXG4gICAgQF9tb2RlbC5hcHBseURlbHRhKGRlbHRhLCBkZWx0YV9vcGVyYXRpb25zKVxuXG4gIHVuc2VsZWN0QWxsOiAoZnJvbSwgdG8pLT5cbiAgICBzZWxlY3QgZnJvbSwgdG8sIHt9LCB0cnVlXG5cbiAgIyB1bnNlbGVjdCBfZnJvbV8sIF90b18gd2l0aCBhbiBfYXR0cmlidXRlX1xuICB1bnNlbGVjdDogKGZyb20sIHRvLCBhdHRycyktPlxuICAgIGlmIHR5cGVvZiBhdHRycyBpcyBcInN0cmluZ1wiXG4gICAgICBhdHRycyA9IFthdHRyc11cbiAgICBpZiBhdHRycy5jb25zdHJ1Y3RvciBpc250IEFycmF5XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJZLlNlbGVjdGlvbnMucHJvdG90eXBlLnVuc2VsZWN0IGV4cGVjdHMgYW4gQXJyYXkgb3IgU3RyaW5nIGFzIHRoZSB0aGlyZCBwYXJhbWV0ZXIgKGF0dHJpYnV0ZXMpIVwiXG4gICAgaWYgYXR0cnMubGVuZ3RoIDw9IDBcbiAgICAgIHJldHVyblxuICAgIGRlbHRhX29wZXJhdGlvbnMgPVxuICAgICAgZnJvbTogZnJvbVxuICAgICAgdG86IHRvXG4gICAgZGVsdGEgPVxuICAgICAgYXR0cnM6IGF0dHJzXG4gICAgICB0eXBlOiBcInVuc2VsZWN0XCJcblxuICAgIEBfbW9kZWwuYXBwbHlEZWx0YShkZWx0YSwgZGVsdGFfb3BlcmF0aW9ucylcblxuICAjICogZ2V0IGFsbCB0aGUgc2VsZWN0aW9ucyBvZiBhIHktbGlzdFxuICAjICogdGhpcyB3aWxsIGFsc28gdGVzdCBpZiB0aGUgc2VsZWN0aW9ucyBhcmUgd2VsbCBmb3JtZWQgKGFmdGVyICRmcm9tIGZvbGxvd3MgJHRvIGZvbGxvd3MgJGZyb20gLi4pXG4gIGdldFNlbGVjdGlvbnM6IChsaXN0KS0+XG4gICAgbyA9IGxpc3QucmVmKDApXG4gICAgaWYgbm90IG8/XG4gICAgICByZXR1cm4gW11cblxuICAgIHNlbF9zdGFydCA9IG51bGxcbiAgICBwb3MgPSAwXG4gICAgcmVzdWx0ID0gW11cblxuICAgIHdoaWxlIG8ubmV4dF9jbD9cbiAgICAgIGlmIG8uaXNEZWxldGVkKClcbiAgICAgICAgaWYgby5zZWxlY3Rpb24/XG4gICAgICAgICAgY29uc29sZS5sb2cgXCJZb3UgZm9yZ290IHRvIGRlbGV0ZSB0aGUgc2VsZWN0aW9uIGZyb20gdGhpcyBvcGVyYXRpb24hIFBsZWFzZSB3cml0ZSBhbiBpc3N1ZSBob3cgdG8gcmVwcm9kdWNlIHRoaXMgYnVnISAoaXQgY291bGQgbGVhZCB0byBpbmNvbnNpc3RlbmNpZXMhKVwiXG4gICAgICAgIG8gPSBvLm5leHRfY2xcbiAgICAgICAgY29udGludWVcbiAgICAgIGlmIG8uc2VsZWN0aW9uP1xuICAgICAgICBpZiBvLnNlbGVjdGlvbi5mcm9tIGlzIG9cbiAgICAgICAgICBpZiBzZWxfc3RhcnQ/XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJGb3VuZCB0d28gY29uc2VjdXRpdmUgZnJvbSBlbGVtZW50cy4gVGhlIHNlbGVjdGlvbnMgYXJlIG5vIGxvbmdlciBzYWZlIHRvIHVzZSEgKGNvbnRhY3QgdGhlIG93bmVyIG9mIHRoZSByZXBvc2l0b3J5KVwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2VsX3N0YXJ0ID0gcG9zXG4gICAgICAgIGlmIG8uc2VsZWN0aW9uLnRvIGlzIG9cbiAgICAgICAgICBpZiBzZWxfc3RhcnQ/XG4gICAgICAgICAgICBudW1iZXJfb2ZfYXR0cnMgPSAwXG4gICAgICAgICAgICBhdHRycyA9IHt9XG4gICAgICAgICAgICBmb3Igbix2IG9mIG8uc2VsZWN0aW9uLmF0dHJzXG4gICAgICAgICAgICAgIGF0dHJzW25dID0gdlxuICAgICAgICAgICAgcmVzdWx0LnB1c2hcbiAgICAgICAgICAgICAgZnJvbTogc2VsX3N0YXJ0XG4gICAgICAgICAgICAgIHRvOiBwb3NcbiAgICAgICAgICAgICAgYXR0cnM6IGF0dHJzXG4gICAgICAgICAgICBzZWxfc3RhcnQgPSBudWxsXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiRm91bmQgdHdvIGNvbnNlY3V0aXZlIHRvIGVsZW1lbnRzLiBUaGUgc2VsZWN0aW9ucyBhcmUgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlISAoY29udGFjdCB0aGUgb3duZXIgb2YgdGhlIHJlcG9zaXRvcnkpXCJcbiAgICAgICAgZWxzZSBpZiBvLnNlbGVjdGlvbi5mcm9tIGlzbnQgb1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIlRoaXMgcmVmZXJlbmNlIHNob3VsZCBub3QgcG9pbnQgdG8gdGhpcyBzZWxlY3Rpb24sIGJlY2F1c2UgdGhlIHNlbGVjdGlvbiBkb2VzIG5vdCBwb2ludCB0byB0aGUgcmVmZXJlbmNlLiBUaGUgc2VsZWN0aW9ucyBhcmUgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlISAoY29udGFjdCB0aGUgb3duZXIgb2YgdGhlIHJlcG9zaXRvcnkpXCJcbiAgICAgIHBvcysrXG4gICAgICBvID0gby5uZXh0X2NsXG4gICAgcmV0dXJuIHJlc3VsdFxuXG4gIG9ic2VydmU6IChmKS0+XG4gICAgQF9saXN0ZW5lcnMucHVzaCBmXG5cbiAgdW5vYnNlcnZlOiAoZiktPlxuICAgIEBfbGlzdGVuZXJzID0gQF9saXN0ZW5lcnMuZmlsdGVyIChnKS0+XG4gICAgICBmICE9IGdcblxuXG5pZiB3aW5kb3c/XG4gIGlmIHdpbmRvdy5ZP1xuICAgIHdpbmRvdy5ZLlNlbGVjdGlvbnMgPSBZU2VsZWN0aW9uc1xuICBlbHNlXG4gICAgdGhyb3cgbmV3IEVycm9yIFwiWW91IG11c3QgZmlyc3QgaW1wb3J0IFkhXCJcblxuaWYgbW9kdWxlP1xuICBtb2R1bGUuZXhwb3J0cyA9IFlTZWxlY3Rpb25zXG4iXX0=
