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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkg6XFxHaXRIdWJcXHktc2VsZWN0aW9uc1xcbm9kZV9tb2R1bGVzXFxndWxwLWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiSDpcXEdpdEh1YlxceS1zZWxlY3Rpb25zXFxsaWJcXHktc2VsZWN0aW9ucy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNFQSxJQUFBLDRCQUFBOztBQUFBLGVBQUEsR0FBa0IsU0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLE9BQVAsR0FBQTtBQUNoQixNQUFBLElBQUE7O0lBRHVCLFVBQVE7R0FDL0I7QUFBQSxPQUFBLE1BQUE7YUFBQTtBQUNFLElBQUEsSUFBRyxDQUFBLENBQUssY0FBQSxJQUFVLENBQUUsQ0FBQSxDQUFBLENBQUYsS0FBUSxDQUFuQixDQUFQO0FBQ0UsYUFBTyxLQUFQLENBREY7S0FERjtBQUFBLEdBQUE7QUFHQSxFQUFBLElBQUcsT0FBSDtXQUNFLGVBQUEsQ0FBZ0IsQ0FBaEIsRUFBa0IsQ0FBbEIsRUFBb0IsS0FBcEIsRUFERjtHQUFBLE1BQUE7V0FHRSxLQUhGO0dBSmdCO0FBQUEsQ0FBbEIsQ0FBQTs7QUFBQTtBQVdlLEVBQUEscUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixFQUR0QixDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsTUFBRCxHQUFVLEVBSFYsQ0FEVztFQUFBLENBQWI7O0FBQUEsd0JBTUEsS0FBQSxHQUFPLFlBTlAsQ0FBQTs7QUFBQSx3QkFRQSxTQUFBLEdBQVcsU0FBQyxDQUFELEVBQUksU0FBSixHQUFBO0FBQ1QsSUFBQSxJQUFPLG1CQUFQO0FBQ0UsTUFBQSxJQUFDLENBQUEsTUFBRCxHQUFjLElBQUEsU0FBUyxDQUFDLFdBQVYsQ0FBc0IsSUFBdEIsRUFBeUIs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QUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBakIsRUFETztFQUFBLENBdGNULENBQUE7O0FBQUEsd0JBeWNBLFNBQUEsR0FBVyxTQUFDLENBQUQsR0FBQTtXQUNULElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUFaLENBQW1CLFNBQUMsQ0FBRCxHQUFBO2FBQy9CLENBQUEsS0FBSyxFQUQwQjtJQUFBLENBQW5CLEVBREw7RUFBQSxDQXpjWCxDQUFBOztxQkFBQTs7SUFYRixDQUFBOztBQXlkQSxJQUFHLGdEQUFIO0FBQ0UsRUFBQSxJQUFHLGdCQUFIO0FBQ0UsSUFBQSxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVQsR0FBc0IsV0FBdEIsQ0FERjtHQUFBLE1BQUE7QUFHRSxVQUFVLElBQUEsS0FBQSxDQUFNLDBCQUFOLENBQVYsQ0FIRjtHQURGO0NBemRBOztBQStkQSxJQUFHLGdEQUFIO0FBQ0UsRUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQixXQUFqQixDQURGO0NBL2RBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxyXG4jIGNvbXBhcmUgdHdvIG9iamVjdCBmb3IgZXF1YWxpdHkgKG5vIGRlZXAgY2hlY2shKVxyXG5jb21wYXJlX29iamVjdHMgPSAobywgcCwgZG9BZ2Fpbj10cnVlKS0+XHJcbiAgZm9yIG4sdiBvZiBvXHJcbiAgICBpZiBub3QgKHBbbl0/IGFuZCBwW25dIGlzIHYpXHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG4gIGlmIGRvQWdhaW5cclxuICAgIGNvbXBhcmVfb2JqZWN0cyhwLG8sZmFsc2UpXHJcbiAgZWxzZVxyXG4gICAgdHJ1ZVxyXG5cclxuXHJcbmNsYXNzIFlTZWxlY3Rpb25zXHJcbiAgY29uc3RydWN0b3I6ICgpLT5cclxuICAgIEBfbGlzdGVuZXJzID0gW11cclxuICAgIEBfY29tcG9zaXRpb25fdmFsdWUgPSBbXVxyXG4gICAgIyB3ZSBwdXQgYWxsIHRoZSBsaXN0cyB3ZSB1c2UgaW4gdGhpcyBhcnJheVxyXG4gICAgQF9saXN0cyA9IFtdXHJcblxyXG4gIF9uYW1lOiBcIlNlbGVjdGlvbnNcIlxyXG5cclxuICBfZ2V0TW9kZWw6IChZLCBPcGVyYXRpb24pIC0+XHJcbiAgICBpZiBub3QgQF9tb2RlbD9cclxuICAgICAgQF9tb2RlbCA9IG5ldyBPcGVyYXRpb24uQ29tcG9zaXRpb24oQCwgW10pLmV4ZWN1dGUoKVxyXG4gICAgQF9tb2RlbFxyXG5cclxuICBfc2V0TW9kZWw6IChAX21vZGVsKS0+XHJcblxyXG4gIF9nZXRDb21wb3NpdGlvblZhbHVlOiAoKS0+XHJcbiAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zID0ge31cclxuICAgIGNvbXBvc2l0aW9uX3ZhbHVlID0gZm9yIHYsaSBpbiBAX2NvbXBvc2l0aW9uX3ZhbHVlXHJcbiAgICAgIGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnNbXCJcIitpK1wiL2Zyb21cIl0gPSB2LmZyb21cclxuICAgICAgY29tcG9zaXRpb25fdmFsdWVfb3BlcmF0aW9uc1tcIlwiK2krXCIvdG9cIl0gPSB2LnRvXHJcbiAgICAgIHtcclxuICAgICAgICBhdHRyczogdi5hdHRyc1xyXG4gICAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY29tcG9zaXRpb25fdmFsdWUgOiBjb21wb3NpdGlvbl92YWx1ZVxyXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zOiBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zXHJcbiAgICB9XHJcblxyXG5cclxuICBfc2V0Q29tcG9zaXRpb25WYWx1ZTogKGNvbXBvc2l0aW9uX3ZhbHVlKS0+XHJcbiAgICBmb3IgdiBpbiBjb21wb3NpdGlvbl92YWx1ZVxyXG4gICAgICB2LnR5cGUgPSBcInNlbGVjdFwiXHJcbiAgICAgIEBfYXBwbHkgdlxyXG5cclxuICBfYXBwbHk6IChkZWx0YSktPlxyXG4gICAgdW5kb3MgPSBbXSAjIGxpc3Qgb2YgZGVsdGFzIHRoYXQgYXJlIG5lY2Vzc2FyeSB0byB1bmRvIHRoZSBjaGFuZ2VcclxuXHJcbiAgICBpZiBkZWx0YS5mcm9tLmlzRGVsZXRlZCgpXHJcbiAgICAgIGRlbHRhLmZyb20gPSBkZWx0YS5mcm9tLmdldE5leHQoKVxyXG4gICAgaWYgZGVsdGEudG8uaXNEZWxldGVkKClcclxuICAgICAgZGVsdGEudG8gPSBkZWx0YS50by5nZXRQcmV2KClcclxuXHJcbiAgICBmcm9tID0gZGVsdGEuZnJvbVxyXG4gICAgdG8gPSBkZWx0YS50b1xyXG4gICAgaWYgZnJvbS5nZXRQcmV2KCkgaXMgdG9cclxuICAgICAgIyBUaGVyZSBpcyBub3RoaW5nIHRvIHNlbGVjdCBhbnltb3JlIVxyXG4gICAgICByZXR1cm4gdW5kb3NcclxuXHJcblxyXG4gICAgI1xyXG4gICAgIyBBc3N1bWluZyAkZnJvbSBpcyBkZWxldGVkIGF0IHNvbWUgcG9pbnQuIFdlIG5lZWQgdG8gY2hhbmdlIHRoZSBzZWxlY3Rpb25cclxuICAgICMgX2JlZm9yZV8gdGhlIEdDIHJlbW92ZXMgaXQgY29tcGxldGVseSBmcm9tIHRoZSBsaXN0LiBUaGVyZWZvcmUsIHdlIGxpc3RlbiB0b1xyXG4gICAgIyBcImRlbGV0ZVwiIGV2ZW50cywgYW5kIGlmIHRoYXQgcGFydGljdWxhciBvcGVyYXRpb24gaGFzIGEgc2VsZWN0aW9uXHJcbiAgICAjIChvLnNzZWxlY3Rpb24/KSB3ZSBtb3ZlIHRoZSBzZWxlY3Rpb24gdG8gdGhlIG5leHQgdW5kZWxldGVkIG9wZXJhdGlvbiwgaWZcclxuICAgICMgYW55LiBJdCBhbHNvIGhhbmRsZXMgdGhlIGNhc2UgdGhhdCB0aGVyZSBpcyBub3RoaW5nIHRvIHNlbGVjdCBhbnltb3JlIChlLmcuXHJcbiAgICAjIGV2ZXJ5dGhpbmcgaW5zaWRlIHRoZSBzZWxlY3Rpb24gaXMgZGVsZXRlZCkuIFRoZW4gd2UgcmVtb3ZlIHRoZSBzZWxlY3Rpb25cclxuICAgICMgY29tcGxldGVseVxyXG4gICAgI1xyXG4gICAgIyBpZiBuZXZlciBhcHBsaWVkIGEgZGVsdGEgb24gdGhpcyBsaXN0LCBhZGQgYSBsaXN0ZW5lciB0byBpdCBpbiBvcmRlciB0byBjaGFuZ2Ugc2VsZWN0aW9ucyBpZiBuZWNlc3NhcnlcclxuICAgIGlmIGRlbHRhLnR5cGUgaXMgXCJzZWxlY3RcIlxyXG4gICAgICBwYXJlbnQgPSBmcm9tLmdldFBhcmVudCgpXHJcbiAgICAgIHBhcmVudF9leGlzdHMgPSBmYWxzZVxyXG4gICAgICBmb3IgcCBpbiBAX2xpc3RzXHJcbiAgICAgICAgaWYgcGFyZW50IGlzIEBfbGlzdHNbcF1cclxuICAgICAgICAgIHBhcmVudF9leGlzdHMgPSB0cnVlXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICBpZiBub3QgcGFyZW50X2V4aXN0c1xyXG4gICAgICAgIEBfbGlzdHMucHVzaCBwYXJlbnRcclxuICAgICAgICBwYXJlbnQub2JzZXJ2ZSAoZXZlbnRzKT0+XHJcbiAgICAgICAgICBmb3IgZXZlbnQgaW4gZXZlbnRzXHJcbiAgICAgICAgICAgIGlmIGV2ZW50LnR5cGUgaXMgXCJkZWxldGVcIlxyXG4gICAgICAgICAgICAgIGlmIGV2ZW50LnJlZmVyZW5jZS5zZWxlY3Rpb24/XHJcbiAgICAgICAgICAgICAgICByZWYgPSBldmVudC5yZWZlcmVuY2VcclxuICAgICAgICAgICAgICAgIHNlbCA9IHJlZi5zZWxlY3Rpb25cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSByZWYuc2VsZWN0aW9uICMgZGVsZXRlIGl0LCBiZWNhdXNlIHJlZiBpcyBnb2luZyB0byBnZXQgZGVsZXRlZCFcclxuICAgICAgICAgICAgICAgIGlmIHNlbC5mcm9tIGlzIHJlZiBhbmQgc2VsLnRvIGlzIHJlZlxyXG4gICAgICAgICAgICAgICAgICBAX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlIHNlbFxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBzZWwuZnJvbSBpcyByZWZcclxuICAgICAgICAgICAgICAgICAgcHJldiA9IHJlZi5nZXROZXh0KClcclxuICAgICAgICAgICAgICAgICAgc2VsLmZyb20gPSBwcmV2XHJcbiAgICAgICAgICAgICAgICAgIHByZXYuc2VsZWN0aW9uID0gc2VsXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHNlbC50byBpcyByZWZcclxuICAgICAgICAgICAgICAgICAgbmV4dCA9IHJlZi5nZXRQcmV2KClcclxuICAgICAgICAgICAgICAgICAgc2VsLnRvID0gbmV4dFxyXG4gICAgICAgICAgICAgICAgICBuZXh0LnNlbGVjdGlvbiA9IHNlbFxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJGb3VuZCB3ZWlyZCBpbmNvbnNpc3RlbmN5ISBZLlNlbGVjdGlvbnMgaXMgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlIVwiXHJcbiAgICAgICAgICAgICAgbmV4dCA9IGV2ZW50LnJlZmVyZW5jZS5nZXROZXh0KClcclxuICAgICAgICAgICAgICBpZiBuZXh0LnNlbGVjdGlvbj9cclxuICAgICAgICAgICAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBuZXh0LnNlbGVjdGlvblxyXG5cclxuICAgICMgbm90aWZ5IGxpc3RlbmVyczpcclxuICAgIG9ic2VydmVyX2NhbGwgPVxyXG4gICAgICBmcm9tOiBmcm9tXHJcbiAgICAgIHRvOiB0b1xyXG4gICAgICB0eXBlOiBkZWx0YS50eXBlXHJcbiAgICAgIGF0dHJzOiBkZWx0YS5hdHRyc1xyXG4gICAgZm9yIGwgaW4gQF9saXN0ZW5lcnNcclxuICAgICAgbC5jYWxsIHRoaXMsIG9ic2VydmVyX2NhbGxcclxuICAgIGNyZWF0ZVNlbGVjdGlvbiA9IChmcm9tLCB0bywgYXR0cnMpPT5cclxuICAgICAgbmV3X2F0dHJzID0ge31cclxuICAgICAgZm9yIG4sdiBvZiBhdHRyc1xyXG4gICAgICAgIG5ld19hdHRyc1tuXSA9IHZcclxuICAgICAgbmV3X3NlbCA9IHtcclxuICAgICAgICBmcm9tOiBmcm9tXHJcbiAgICAgICAgdG86IHRvXHJcbiAgICAgICAgYXR0cnM6IG5ld19hdHRyc1xyXG4gICAgICB9XHJcbiAgICAgIEBfY29tcG9zaXRpb25fdmFsdWUucHVzaCBuZXdfc2VsXHJcbiAgICAgIG5ld19zZWxcclxuXHJcbiAgICBleHRlbmRTZWxlY3Rpb24gPSAoc2VsZWN0aW9uKS0+XHJcbiAgICAgIGlmIGRlbHRhLnR5cGUgaXMgXCJ1bnNlbGVjdFwiXHJcbiAgICAgICAgdW5kb19hdHRycyA9IHt9XHJcbiAgICAgICAgZm9yIG4gaW4gZGVsdGEuYXR0cnNcclxuICAgICAgICAgIGlmIHNlbGVjdGlvbi5hdHRyc1tuXT9cclxuICAgICAgICAgICAgdW5kb19hdHRyc1tuXSA9IHNlbGVjdGlvbi5hdHRyc1tuXVxyXG4gICAgICAgICAgZGVsZXRlIHNlbGVjdGlvbi5hdHRyc1tuXVxyXG4gICAgICAgIHVuZG9zLnB1c2hcclxuICAgICAgICAgIGZyb206IGRlbHRhLmZyb21cclxuICAgICAgICAgIHRvOiBkZWx0YS50b1xyXG4gICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNcclxuICAgICAgICAgIHR5cGU6IFwic2VsZWN0XCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHVuZG9fYXR0cnMgPSB7fSAjIGZvciB1bmRvIHNlbGVjdGlvbiAob3ZlcndyaXRlIG9mIGV4aXN0aW5nIHNlbGVjdGlvbilcclxuICAgICAgICB1bmRvX2F0dHJzX2xpc3QgPSBbXSAjIGZvciB1bmRvIHNlbGVjdGlvbiAobm90IG92ZXJ3cml0ZSlcclxuICAgICAgICB1bmRvX25lZWRfdW5zZWxlY3QgPSBmYWxzZVxyXG4gICAgICAgIHVuZG9fbmVlZF9zZWxlY3QgPSBmYWxzZVxyXG4gICAgICAgIGlmIGRlbHRhLm92ZXJ3cml0ZT8gYW5kIGRlbHRhLm92ZXJ3cml0ZVxyXG4gICAgICAgICAgIyBvdmVyd3JpdGUgZXZlcnl0aGluZyB0aGF0IHRoZSBkZWx0YSBkb2Vzbid0IGV4cGVjdFxyXG4gICAgICAgICAgZm9yIG4sdiBvZiBzZWxlY3Rpb24uYXR0cnNcclxuICAgICAgICAgICAgaWYgbm90IGRlbHRhLmF0dHJzW25dP1xyXG4gICAgICAgICAgICAgIHVuZG9fbmVlZF9zZWxlY3QgPSB0cnVlXHJcbiAgICAgICAgICAgICAgdW5kb19hdHRyc1tuXSA9IHZcclxuICAgICAgICAgICAgICAjIG11c3Qgbm90IGRlbGV0ZSBhdHRyaWJ1dGVzIG9mICRzZWxlY3Rpb24uYXR0cnMgaW4gdGhpcyBsb29wLFxyXG4gICAgICAgICAgICAgICMgc28gd2UgZG8gaXQgaW4gdGhlIG5leHQgb25lXHJcbiAgICAgICAgICBmb3Igbix2IG9mIHVuZG9fYXR0cnNcclxuICAgICAgICAgICAgZGVsZXRlIHNlbGVjdGlvbi5hdHRyc1tuXVxyXG5cclxuICAgICAgICAjIGFwcGx5IHRoZSBkZWx0YSBvbiB0aGUgc2VsZWN0aW9uXHJcbiAgICAgICAgZm9yIG4sdiBvZiBkZWx0YS5hdHRyc1xyXG4gICAgICAgICAgaWYgc2VsZWN0aW9uLmF0dHJzW25dP1xyXG4gICAgICAgICAgICB1bmRvX2F0dHJzW25dID0gc2VsZWN0aW9uLmF0dHJzW25dXHJcbiAgICAgICAgICAgIHVuZG9fbmVlZF9zZWxlY3QgPSB0cnVlXHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHVuZG9fYXR0cnNfbGlzdC5wdXNoIG5cclxuICAgICAgICAgICAgdW5kb19uZWVkX3Vuc2VsZWN0ID0gdHJ1ZVxyXG4gICAgICAgICAgc2VsZWN0aW9uLmF0dHJzW25dID0gdlxyXG4gICAgICAgIGlmIHVuZG9fbmVlZF9zZWxlY3RcclxuICAgICAgICAgIHVuZG9zLnB1c2hcclxuICAgICAgICAgICAgZnJvbTogc2VsZWN0aW9uLmZyb21cclxuICAgICAgICAgICAgdG86IHNlbGVjdGlvbi50b1xyXG4gICAgICAgICAgICBhdHRyczogdW5kb19hdHRyc1xyXG4gICAgICAgICAgICB0eXBlOiBcInNlbGVjdFwiXHJcbiAgICAgICAgaWYgdW5kb19uZWVkX3Vuc2VsZWN0XHJcbiAgICAgICAgICB1bmRvcy5wdXNoXHJcbiAgICAgICAgICAgIGZyb206IHNlbGVjdGlvbi5mcm9tXHJcbiAgICAgICAgICAgIHRvOiBzZWxlY3Rpb24udG9cclxuICAgICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNfbGlzdFxyXG4gICAgICAgICAgICB0eXBlOiBcInVuc2VsZWN0XCJcclxuXHJcbiAgICAjIEFsZ29yaXRobSBvdmVydmlldzpcclxuICAgICMgMS4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoIGZyb21cclxuICAgICMgMi4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoIHRvXHJcbiAgICAjIDMuIGV4dGVuZCAvIGFkZCBzZWxlY3Rpb25zIGluYmV0d2VlblxyXG4gICAgI1xyXG4gICAgIyMjIyAxLiBjdXQgb2ZmIHRoZSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggZnJvbVxyXG4gICAgI1xyXG4gICAgY3V0X29mZl9mcm9tID0gKCktPlxyXG4gICAgICAjIGNoZWNrIGlmIGEgc2VsZWN0aW9uICh0byB0aGUgbGVmdCBvZiAkZnJvbSkgaW50ZXJzZWN0cyB3aXRoICRmcm9tXHJcbiAgICAgIGlmIGZyb20uc2VsZWN0aW9uPyBhbmQgZnJvbS5zZWxlY3Rpb24uZnJvbSBpcyBmcm9tXHJcbiAgICAgICAgIyBkb2VzIG5vdCBpbnRlcnNlY3QsIGJlY2F1c2UgdGhlIHN0YXJ0IGlzIGFscmVhZHkgc2VsZWN0ZWRcclxuICAgICAgICByZXR1cm5cclxuICAgICAgIyBmaW5kIGZpcnN0IHNlbGVjdGlvbiB0byB0aGUgbGVmdFxyXG4gICAgICBvID0gZnJvbS5wcmV2X2NsXHJcbiAgICAgIHdoaWxlIChub3Qgby5zZWxlY3Rpb24/KSBhbmQgKG8udHlwZSBpc250IFwiRGVsaW1pdGVyXCIpXHJcbiAgICAgICAgbyA9IG8ucHJldl9jbFxyXG4gICAgICBpZiAobm90IG8uc2VsZWN0aW9uPykgb3Igby5zZWxlY3Rpb24udG8gaXMgb1xyXG4gICAgICAgICMgbm8gaW50ZXJzZWN0aW9uXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgICMgV2UgZm91bmQgYSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggJGZyb20uXHJcbiAgICAgICMgTm93IHdlIGhhdmUgdG8gY2hlY2sgaWYgaXQgYWxzbyBpbnRlcnNlY3RzIHdpdGggJHRvLlxyXG4gICAgICAjIFRoZW4gd2UgY3V0IGl0IGluIHN1Y2ggYSB3YXksXHJcbiAgICAgICMgdGhhdCB0aGUgc2VsZWN0aW9uIGRvZXMgbm90IGludGVyc2VjdCB3aXRoICRmcm9tIGFuZCAkdG8gYW55bW9yZS5cclxuXHJcbiAgICAgICMgdGhpcyBpcyBhIHJlZmVyZW5jZSBmb3IgdGhlIHNlbGVjdGlvbnMgdGhhdCBhcmUgY3JlYXRlZC9tb2RpZmllZDpcclxuICAgICAgIyBvbGRfc2VsZWN0aW9uIGlzIG91dGVyIChub3QgYmV0d2VlbiAkZnJvbSAkdG8pXHJcbiAgICAgICMgICAtIHdpbGwgYmUgY2hhbmdlZCBpbiBzdWNoIGEgd2F5IHRoYXQgaXQgaXMgdG8gdGhlIGxlZnQgb2YgJGZyb21cclxuICAgICAgIyBuZXdfc2VsZWN0aW9uIGlzIGlubmVyIChpbmJldHdlZW4gJGZyb20gJHRvKVxyXG4gICAgICAjICAgLSBjcmVhdGVkLCByaWdodCBhZnRlciAkZnJvbVxyXG4gICAgICAjIG9wdF9zZWxlY3Rpb24gaXMgb3V0ZXIgKGFmdGVyICR0bylcclxuICAgICAgIyAgIC0gY3JlYXRlZCAoaWYgbmVjZXNzYXJ5KSwgcmlnaHQgYWZ0ZXIgJHRvXHJcbiAgICAgIG9sZF9zZWxlY3Rpb24gPSBvLnNlbGVjdGlvblxyXG5cclxuICAgICAgIyBjaGVjayBpZiBmb3VuZCBzZWxlY3Rpb24gYWxzbyBpbnRlcnNlY3RzIHdpdGggJHRvXHJcbiAgICAgICMgKiBzdGFydGluZyBmcm9tICRmcm9tLCBnbyB0byB0aGUgcmlnaHQgdW50aWwgeW91IGZvdW5kIGVpdGhlciAkdG8gb3Igb2xkX3NlbGVjdGlvbi50b1xyXG4gICAgICAjICoqIGlmICR0bzogbm8gaW50ZXJzZWN0aW9uIHdpdGggJHRvXHJcbiAgICAgICMgKiogaWYgJG9sZF9zZWxlY3Rpb24udG86IGludGVyc2VjdGlvbiB3aXRoICR0byFcclxuICAgICAgbyA9IGZyb21cclxuICAgICAgd2hpbGUgKG8gaXNudCBvbGRfc2VsZWN0aW9uLnRvKSBhbmQgKG8gaXNudCB0bylcclxuICAgICAgICBvID0gby5uZXh0X2NsXHJcblxyXG4gICAgICBpZiBvIGlzIG9sZF9zZWxlY3Rpb24udG9cclxuICAgICAgICAjIG5vIGludGVyc2VjdGlvbiB3aXRoIHRvIVxyXG4gICAgICAgICMgY3JlYXRlICRuZXdfc2VsZWN0aW9uXHJcbiAgICAgICAgbmV3X3NlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiBmcm9tLCBvbGRfc2VsZWN0aW9uLnRvLCBvbGRfc2VsZWN0aW9uLmF0dHJzXHJcblxyXG4gICAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXNcclxuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvID0gZnJvbS5wcmV2X2NsXHJcbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlcyAocG9pbnRlcnMgdG8gcmVzcGVjdGl2ZSBzZWxlY3Rpb25zKVxyXG4gICAgICAgIG9sZF9zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gb2xkX3NlbGVjdGlvblxyXG5cclxuICAgICAgICBuZXdfc2VsZWN0aW9uLmZyb20uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxyXG4gICAgICAgIG5ld19zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgIyB0aGVyZSBpcyBhbiBpbnRlcnNlY3Rpb24gd2l0aCB0byFcclxuXHJcbiAgICAgICAgIyBjcmVhdGUgJG5ld19zZWxlY3Rpb25cclxuICAgICAgICBuZXdfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIGZyb20sIHRvLCBvbGRfc2VsZWN0aW9uLmF0dHJzXHJcblxyXG4gICAgICAgICMgY3JlYXRlICRvcHRfc2VsZWN0aW9uXHJcbiAgICAgICAgb3B0X3NlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiB0by5uZXh0X2NsLCBvbGRfc2VsZWN0aW9uLnRvLCBvbGRfc2VsZWN0aW9uLmF0dHJzXHJcblxyXG4gICAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXNcclxuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvID0gZnJvbS5wcmV2X2NsXHJcbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlcyAocG9pbnRlcnMgdG8gcmVzcGVjdGl2ZSBzZWxlY3Rpb25zKVxyXG4gICAgICAgIG9sZF9zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gb2xkX3NlbGVjdGlvblxyXG5cclxuICAgICAgICBvcHRfc2VsZWN0aW9uLmZyb20uc2VsZWN0aW9uID0gb3B0X3NlbGVjdGlvblxyXG4gICAgICAgIG9wdF9zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gb3B0X3NlbGVjdGlvblxyXG5cclxuICAgICAgICBuZXdfc2VsZWN0aW9uLmZyb20uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxyXG4gICAgICAgIG5ld19zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxyXG5cclxuXHJcbiAgICBjdXRfb2ZmX2Zyb20oKVxyXG5cclxuICAgICMgMi4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoICR0b1xyXG4gICAgY3V0X29mZl90byA9ICgpLT5cclxuICAgICAgIyBjaGVjayBpZiBhIHNlbGVjdGlvbiAodG8gdGhlIGxlZnQgb2YgJHRvKSBpbnRlcnNlY3RzIHdpdGggJHRvXHJcbiAgICAgIGlmIHRvLnNlbGVjdGlvbj8gYW5kIHRvLnNlbGVjdGlvbi50byBpcyB0b1xyXG4gICAgICAgICMgZG9lcyBub3QgaW50ZXJzZWN0LCBiZWNhdXNlIHRoZSBlbmQgaXMgYWxyZWFkeSBzZWxlY3RlZFxyXG4gICAgICAgIHJldHVyblxyXG4gICAgICAjIGZpbmQgZmlyc3Qgc2VsZWN0aW9uIHRvIHRoZSBsZWZ0XHJcbiAgICAgIG8gPSB0b1xyXG4gICAgICB3aGlsZSAobm90IG8uc2VsZWN0aW9uPykgYW5kIChvIGlzbnQgZnJvbSlcclxuICAgICAgICBvID0gby5wcmV2X2NsXHJcbiAgICAgIGlmIChub3Qgby5zZWxlY3Rpb24/KSBvciBvLnNlbGVjdGlvbltcInRvXCJdIGlzIG9cclxuICAgICAgICAjIG5vIGludGVyc2VjdGlvblxyXG4gICAgICAgIHJldHVyblxyXG4gICAgICAjIFdlIGZvdW5kIGEgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoICR0by5cclxuICAgICAgIyBOb3cgd2UgaGF2ZSB0byBjdXQgaXQgaW4gc3VjaCBhIHdheSxcclxuICAgICAgIyB0aGF0IHRoZSBzZWxlY3Rpb24gZG9lcyBub3QgaW50ZXJzZWN0IHdpdGggJHRvIGFueW1vcmUuXHJcblxyXG4gICAgICAjIHRoaXMgaXMgYSByZWZlcmVuY2UgZm9yIHRoZSBzZWxlY3Rpb25zIHRoYXQgYXJlIGNyZWF0ZWQvbW9kaWZpZWQ6XHJcbiAgICAgICMgaXQgaXMgc2ltaWxhciB0byB0aGUgb25lIGFib3ZlLCBleGNlcHQgdGhhdCB3ZSBkbyBub3QgbmVlZCBvcHRfc2VsZWN0aW9uIGFueW1vcmUhXHJcbiAgICAgICMgb2xkX3NlbGVjdGlvbiBpcyBpbm5lciAoYmV0d2VlbiAkZnJvbSBhbmQgJHRvKVxyXG4gICAgICAjICAgLSB3aWxsIGJlIGNoYW5nZWQgaW4gc3VjaCBhIHdheSB0aGF0IGl0IGlzIHRvIHRoZSBsZWZ0IG9mICR0b1xyXG4gICAgICAjIG5ld19zZWxlY3Rpb24gaXMgb3V0ZXIgKCBvdXRlciAkZnJvbSBhbmQgJHRvKVxyXG4gICAgICAjICAgLSBjcmVhdGVkLCByaWdodCBhZnRlciAkdG9cclxuICAgICAgb2xkX3NlbGVjdGlvbiA9IG8uc2VsZWN0aW9uXHJcblxyXG4gICAgICAjIGNyZWF0ZSAkbmV3X3NlbGVjdGlvblxyXG4gICAgICBuZXdfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIHRvLm5leHRfY2wsIG9sZF9zZWxlY3Rpb24udG8sIG9sZF9zZWxlY3Rpb24uYXR0cnNcclxuXHJcbiAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXNcclxuICAgICAgb2xkX3NlbGVjdGlvbi50byA9IHRvXHJcbiAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXMgKHBvaW50ZXJzIHRvIHJlc3BlY3RpdmUgc2VsZWN0aW9ucylcclxuICAgICAgb2xkX3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBvbGRfc2VsZWN0aW9uXHJcblxyXG4gICAgICBuZXdfc2VsZWN0aW9uLmZyb20uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxyXG4gICAgICBuZXdfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cclxuXHJcbiAgICBjdXRfb2ZmX3RvKClcclxuXHJcbiAgICAjIDMuIGV4dGVuZCAvIGFkZCBzZWxlY3Rpb25zIGluIGJldHdlZW5cclxuICAgIG8gPSBmcm9tXHJcbiAgICB3aGlsZSAobyBpc250IHRvLm5leHRfY2wpXHJcbiAgICAgIGlmIG8uc2VsZWN0aW9uP1xyXG4gICAgICAgICMganVzdCBleHRlbmQgdGhlIGV4aXN0aW5nIHNlbGVjdGlvblxyXG4gICAgICAgIGV4dGVuZFNlbGVjdGlvbiBvLnNlbGVjdGlvbiwgZGVsdGEgIyB3aWxsIHB1c2ggdW5kby1kZWx0YXMgdG8gJHVuZG9zXHJcbiAgICAgICAgc2VsZWN0aW9uID0gby5zZWxlY3Rpb25cclxuICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgc2VsZWN0aW9uXHJcblxyXG4gICAgICAgIG8gPSBzZWxlY3Rpb24udG8ubmV4dF9jbFxyXG4gICAgICAgIHNlbGVjdGlvbl9pc19lbXB0eSA9IHRydWVcclxuICAgICAgICBmb3IgYXR0ciBvZiBzZWxlY3Rpb24uYXR0cnNcclxuICAgICAgICAgIHNlbGVjdGlvbl9pc19lbXB0eSA9IGZhbHNlXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIGlmIHNlbGVjdGlvbl9pc19lbXB0eVxyXG4gICAgICAgICAgQF9yZW1vdmVGcm9tQ29tcG9zaXRpb25WYWx1ZSBzZWxlY3Rpb25cclxuICAgICAgZWxzZVxyXG4gICAgICAgICMgY3JlYXRlIGEgbmV3IHNlbGVjdGlvbiAodW50aWwgeW91IGZpbmQgdGhlIG5leHQgb25lKVxyXG4gICAgICAgIHN0YXJ0ID0gb1xyXG4gICAgICAgIHdoaWxlIChub3Qgby5uZXh0X2NsLnNlbGVjdGlvbj8pIGFuZCAobyBpc250IHRvKVxyXG4gICAgICAgICAgbyA9IG8ubmV4dF9jbFxyXG4gICAgICAgIGVuZCA9IG9cclxuICAgICAgICBpZiBkZWx0YS50eXBlIGlzbnQgXCJ1bnNlbGVjdFwiXHJcbiAgICAgICAgICBhdHRyX2xpc3QgPSBbXVxyXG4gICAgICAgICAgZm9yIG4sdiBvZiBkZWx0YS5hdHRyc1xyXG4gICAgICAgICAgICBhdHRyX2xpc3QucHVzaCBuXHJcbiAgICAgICAgICB1bmRvcy5wdXNoXHJcbiAgICAgICAgICAgIGZyb206IHN0YXJ0XHJcbiAgICAgICAgICAgIHRvOiBlbmRcclxuICAgICAgICAgICAgYXR0cnM6IGF0dHJfbGlzdFxyXG4gICAgICAgICAgICB0eXBlOiBcInVuc2VsZWN0XCJcclxuICAgICAgICAgIHNlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiBzdGFydCwgZW5kLCBkZWx0YS5hdHRyc1xyXG4gICAgICAgICAgc3RhcnQuc2VsZWN0aW9uID0gc2VsZWN0aW9uXHJcbiAgICAgICAgICBlbmQuc2VsZWN0aW9uID0gc2VsZWN0aW9uXHJcbiAgICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgby5zZWxlY3Rpb25cclxuICAgICAgICBvID0gby5uZXh0X2NsXHJcblxyXG4gICAgIyBmaW5kIHRoZSBuZXh0IHNlbGVjdGlvblxyXG4gICAgd2hpbGUgby5pc0RlbGV0ZWQoKSBhbmQgKG5vdCBvLnNlbGVjdGlvbj8pXHJcbiAgICAgIG8gPSBvLm5leHRfY2xcclxuICAgICMgYW5kIGNoZWNrIGlmIHlvdSBjYW4gY29tYmluZSBpdFxyXG4gICAgaWYgby5zZWxlY3Rpb24/XHJcbiAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBvLnNlbGVjdGlvblxyXG4gICAgIyBhbHNvIHJlLWNvbm5lY3QgZnJvbVxyXG4gICAgaWYgZnJvbS5zZWxlY3Rpb24/XHJcbiAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBmcm9tLnNlbGVjdGlvblxyXG5cclxuICAgIHJldHVybiB1bmRvcyAjIGl0IGlzIG5lY2Vzc2FyeSB0aGF0IGRlbHRhIGlzIHJldHVybmVkIGluIHRoZSB3YXkgaXQgd2FzIGFwcGxpZWQgb24gdGhlIGdsb2JhbCBkZWx0YS5cclxuICAgICMgc28gdGhhdCB5anMga25vd3MgZXhhY3RseSB3aGF0IHdhcyBhcHBsaWVkIChhbmQgaG93IHRvIHVuZG8gaXQpLlxyXG5cclxuICBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWU6IChzZWwpLT5cclxuICAgIEBfY29tcG9zaXRpb25fdmFsdWUgPSBAX2NvbXBvc2l0aW9uX3ZhbHVlLmZpbHRlciAobyktPlxyXG4gICAgICBvIGlzbnQgc2VsXHJcbiAgICBkZWxldGUgc2VsLmZyb20uc2VsZWN0aW9uXHJcbiAgICBkZWxldGUgc2VsLnRvLnNlbGVjdGlvblxyXG5cclxuICAjIHRyeSB0byBjb21iaW5lIGEgc2VsZWN0aW9uLCB0byB0aGUgc2VsZWN0aW9uIHRvIGl0cyBsZWZ0IChpZiB0aGVyZSBpcyBhbnkpXHJcbiAgX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQ6IChzZWwpLT5cclxuICAgIGZpcnN0X28gPSBzZWwuZnJvbS5wcmV2X2NsXHJcbiAgICAjIGZpbmQgdGhlIGZpcnN0IHNlbGVjdGlvbiB0byB0aGUgbGVmdFxyXG4gICAgd2hpbGUgZmlyc3Rfbz8gYW5kIGZpcnN0X28uaXNEZWxldGVkKCkgYW5kIG5vdCBmaXJzdF9vLnNlbGVjdGlvbj9cclxuICAgICAgZmlyc3RfbyA9IGZpcnN0X28ucHJldl9jbFxyXG4gICAgaWYgbm90IChmaXJzdF9vPyBhbmQgZmlyc3Rfby5zZWxlY3Rpb24/KVxyXG4gICAgICAjIHRoZXJlIGlzIG5vIHNlbGVjdGlvbiB0byB0aGUgbGVmdFxyXG4gICAgICByZXR1cm5cclxuICAgIGVsc2VcclxuICAgICAgaWYgY29tcGFyZV9vYmplY3RzKGZpcnN0X28uc2VsZWN0aW9uLmF0dHJzLCBzZWwuYXR0cnMpXHJcbiAgICAgICAgIyB3ZSBhcmUgZ29pbmcgdG8gcmVtb3ZlIHRoZSBsZWZ0IHNlbGVjdGlvblxyXG4gICAgICAgICMgRmlyc3QsIHJlbW92ZSBldmVyeSB0cmFjZSBvZiBmaXJzdF9vLnNlbGVjdGlvbiAoc2F2ZSB3aGF0IGlzIG5lY2Vzc2FyeSlcclxuICAgICAgICAjIFRoZW4sIHJlLXNldCBzZWwuZnJvbVxyXG4gICAgICAgICNcclxuICAgICAgICBuZXdfZnJvbSA9IGZpcnN0X28uc2VsZWN0aW9uLmZyb21cclxuICAgICAgICBAX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlIGZpcnN0X28uc2VsZWN0aW9uXHJcblxyXG4gICAgICAgIGlmIHNlbC5mcm9tIGlzbnQgc2VsLnRvXHJcbiAgICAgICAgICBkZWxldGUgc2VsLmZyb20uc2VsZWN0aW9uXHJcblxyXG4gICAgICAgIHNlbC5mcm9tID0gbmV3X2Zyb21cclxuICAgICAgICBuZXdfZnJvbS5zZWxlY3Rpb24gPSBzZWxcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHJldHVyblxyXG5cclxuICAjIFwidW5kb1wiIGEgZGVsdGEgZnJvbSB0aGUgY29tcG9zaXRpb25fdmFsdWVcclxuICBfdW5hcHBseTogKGRlbHRhcyktPlxyXG4gICAgIyBfYXBwbHkgcmV0dXJucyBhIF9saXN0XyBvZiBkZWx0YXMsIHRoYXQgYXJlIG5lY2Nlc3NhcnkgdG8gdW5kbyB0aGUgY2hhbmdlLiBOb3cgd2UgX2FwcGx5IGV2ZXJ5IGRlbHRhIGluIHRoZSBsaXN0IChhbmQgZGlzY2FyZCB0aGUgcmVzdWx0cylcclxuICAgIGZvciBkZWx0YSBpbiBkZWx0YXNcclxuICAgICAgQF9hcHBseSBkZWx0YVxyXG4gICAgcmV0dXJuXHJcblxyXG4gICMgdXBkYXRlIHRoZSBnbG9iYWxEZWx0YSB3aXRoIGRlbHRhXHJcblxyXG5cclxuICAjIHNlbGVjdCBfZnJvbV8sIF90b18gd2l0aCBhbiBfYXR0cmlidXRlX1xyXG4gIHNlbGVjdDogKGZyb20sIHRvLCBhdHRycywgb3ZlcndyaXRlKS0+XHJcbiAgICBsZW5ndGggPSAwXHJcbiAgICBmb3IgYSBvZiBhdHRyc1xyXG4gICAgICBsZW5ndGgrK1xyXG4gICAgICBicmVha1xyXG4gICAgaWYgbGVuZ3RoIDw9IDAgYW5kIG5vdCAob3ZlcndyaXRlPyBhbmQgb3ZlcndyaXRlKVxyXG4gICAgICByZXR1cm5cclxuXHJcbiAgICBkZWx0YV9vcGVyYXRpb25zID1cclxuICAgICAgZnJvbTogZnJvbVxyXG4gICAgICB0bzogdG9cclxuXHJcbiAgICBkZWx0YSA9XHJcbiAgICAgIGF0dHJzOiBhdHRyc1xyXG4gICAgICB0eXBlOiBcInNlbGVjdFwiXHJcblxyXG4gICAgaWYgb3ZlcndyaXRlPyBhbmQgb3ZlcndyaXRlXHJcbiAgICAgIGRlbHRhLm92ZXJ3cml0ZSA9IHRydWVcclxuXHJcbiAgICBAX21vZGVsLmFwcGx5RGVsdGEoZGVsdGEsIGRlbHRhX29wZXJhdGlvbnMpXHJcblxyXG4gIHVuc2VsZWN0QWxsOiAoZnJvbSwgdG8pLT5cclxuICAgIHNlbGVjdCBmcm9tLCB0bywge30sIHRydWVcclxuXHJcbiAgIyB1bnNlbGVjdCBfZnJvbV8sIF90b18gd2l0aCBhbiBfYXR0cmlidXRlX1xyXG4gIHVuc2VsZWN0OiAoZnJvbSwgdG8sIGF0dHJzKS0+XHJcbiAgICBpZiB0eXBlb2YgYXR0cnMgaXMgXCJzdHJpbmdcIlxyXG4gICAgICBhdHRycyA9IFthdHRyc11cclxuICAgIGlmIGF0dHJzLmNvbnN0cnVjdG9yIGlzbnQgQXJyYXlcclxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiWS5TZWxlY3Rpb25zLnByb3RvdHlwZS51bnNlbGVjdCBleHBlY3RzIGFuIEFycmF5IG9yIFN0cmluZyBhcyB0aGUgdGhpcmQgcGFyYW1ldGVyIChhdHRyaWJ1dGVzKSFcIlxyXG4gICAgaWYgYXR0cnMubGVuZ3RoIDw9IDBcclxuICAgICAgcmV0dXJuXHJcbiAgICBkZWx0YV9vcGVyYXRpb25zID1cclxuICAgICAgZnJvbTogZnJvbVxyXG4gICAgICB0bzogdG9cclxuICAgIGRlbHRhID1cclxuICAgICAgYXR0cnM6IGF0dHJzXHJcbiAgICAgIHR5cGU6IFwidW5zZWxlY3RcIlxyXG5cclxuICAgIEBfbW9kZWwuYXBwbHlEZWx0YShkZWx0YSwgZGVsdGFfb3BlcmF0aW9ucylcclxuXHJcbiAgIyAqIGdldCBhbGwgdGhlIHNlbGVjdGlvbnMgb2YgYSB5LWxpc3RcclxuICAjICogdGhpcyB3aWxsIGFsc28gdGVzdCBpZiB0aGUgc2VsZWN0aW9ucyBhcmUgd2VsbCBmb3JtZWQgKGFmdGVyICRmcm9tIGZvbGxvd3MgJHRvIGZvbGxvd3MgJGZyb20gLi4pXHJcbiAgZ2V0U2VsZWN0aW9uczogKGxpc3QpLT5cclxuICAgIG8gPSBsaXN0LnJlZigwKVxyXG4gICAgaWYgbm90IG8/XHJcbiAgICAgIHJldHVybiBbXVxyXG5cclxuICAgIHNlbF9zdGFydCA9IG51bGxcclxuICAgIHBvcyA9IDBcclxuICAgIHJlc3VsdCA9IFtdXHJcblxyXG4gICAgd2hpbGUgby5uZXh0X2NsP1xyXG4gICAgICBpZiBvLmlzRGVsZXRlZCgpXHJcbiAgICAgICAgaWYgby5zZWxlY3Rpb24/XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJZb3UgZm9yZ290IHRvIGRlbGV0ZSB0aGUgc2VsZWN0aW9uIGZyb20gdGhpcyBvcGVyYXRpb24hIHktc2VsZWN0aW9ucyBpcyBubyBsb25nZXIgc2FmZSB0byB1c2UhXCJcclxuICAgICAgICBvID0gby5uZXh0X2NsXHJcbiAgICAgICAgY29udGludWVcclxuICAgICAgaWYgby5zZWxlY3Rpb24/XHJcbiAgICAgICAgaWYgby5zZWxlY3Rpb24uZnJvbSBpcyBvXHJcbiAgICAgICAgICBpZiBzZWxfc3RhcnQ/XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIkZvdW5kIHR3byBjb25zZWN1dGl2ZSBmcm9tIGVsZW1lbnRzLiBUaGUgc2VsZWN0aW9ucyBhcmUgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlISAoY29udGFjdCB0aGUgb3duZXIgb2YgdGhlIHJlcG9zaXRvcnkpXCJcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc2VsX3N0YXJ0ID0gcG9zXHJcbiAgICAgICAgaWYgby5zZWxlY3Rpb24udG8gaXMgb1xyXG4gICAgICAgICAgaWYgc2VsX3N0YXJ0P1xyXG4gICAgICAgICAgICBudW1iZXJfb2ZfYXR0cnMgPSAwXHJcbiAgICAgICAgICAgIGF0dHJzID0ge31cclxuICAgICAgICAgICAgZm9yIG4sdiBvZiBvLnNlbGVjdGlvbi5hdHRyc1xyXG4gICAgICAgICAgICAgIGF0dHJzW25dID0gdlxyXG4gICAgICAgICAgICAgIG51bWJlcl9vZl9hdHRycysrXHJcbiAgICAgICAgICAgIGlmIG51bWJlcl9vZl9hdHRycyA+IDBcclxuICAgICAgICAgICAgICByZXN1bHQucHVzaFxyXG4gICAgICAgICAgICAgICAgZnJvbTogc2VsX3N0YXJ0XHJcbiAgICAgICAgICAgICAgICB0bzogcG9zXHJcbiAgICAgICAgICAgICAgICBhdHRyczogYXR0cnNcclxuICAgICAgICAgICAgc2VsX3N0YXJ0ID0gbnVsbFxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJGb3VuZCB0d28gY29uc2VjdXRpdmUgdG8gZWxlbWVudHMuIFRoZSBzZWxlY3Rpb25zIGFyZSBubyBsb25nZXIgc2FmZSB0byB1c2UhIChjb250YWN0IHRoZSBvd25lciBvZiB0aGUgcmVwb3NpdG9yeSlcIlxyXG4gICAgICAgIGVsc2UgaWYgby5zZWxlY3Rpb24uZnJvbSBpc250IG9cclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIlRoaXMgcmVmZXJlbmNlIHNob3VsZCBub3QgcG9pbnQgdG8gdGhpcyBzZWxlY3Rpb24sIGJlY2F1c2UgdGhlIHNlbGVjdGlvbiBkb2VzIG5vdCBwb2ludCB0byB0aGUgcmVmZXJlbmNlLiBUaGUgc2VsZWN0aW9ucyBhcmUgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlISAoY29udGFjdCB0aGUgb3duZXIgb2YgdGhlIHJlcG9zaXRvcnkpXCJcclxuICAgICAgcG9zKytcclxuICAgICAgbyA9IG8ubmV4dF9jbFxyXG4gICAgcmV0dXJuIHJlc3VsdFxyXG5cclxuICBvYnNlcnZlOiAoZiktPlxyXG4gICAgQF9saXN0ZW5lcnMucHVzaCBmXHJcblxyXG4gIHVub2JzZXJ2ZTogKGYpLT5cclxuICAgIEBfbGlzdGVuZXJzID0gQF9saXN0ZW5lcnMuZmlsdGVyIChnKS0+XHJcbiAgICAgIGYgIT0gZ1xyXG5cclxuXHJcbmlmIHdpbmRvdz9cclxuICBpZiB3aW5kb3cuWT9cclxuICAgIHdpbmRvdy5ZLlNlbGVjdGlvbnMgPSBZU2VsZWN0aW9uc1xyXG4gIGVsc2VcclxuICAgIHRocm93IG5ldyBFcnJvciBcIllvdSBtdXN0IGZpcnN0IGltcG9ydCBZIVwiXHJcblxyXG5pZiBtb2R1bGU/XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBZU2VsZWN0aW9uc1xyXG4iXX0=
