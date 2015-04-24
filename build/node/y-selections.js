var YSelections, compare_objects;

compare_objects = function(obj1, obj2, doAgain) {
  var key, value;
  if (doAgain == null) {
    doAgain = true;
  }
  for (key in obj1) {
    value = obj1[key];
    if (!((obj2[key] != null) && obj2[key] === value)) {
      return false;
    }
  }
  if (doAgain) {
    return compare_objects(obj2, obj1, false);
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
    var composition_value, composition_value_operations, index, value;
    composition_value_operations = {};
    composition_value = (function() {
      var i, len, ref1, results;
      ref1 = this._composition_value;
      results = [];
      for (index = i = 0, len = ref1.length; i < len; index = ++i) {
        value = ref1[index];
        composition_value_operations["" + index + "/from"] = value.from;
        composition_value_operations["" + index + "/to"] = value.to;
        results.push({
          attrs: value.attrs
        });
      }
      return results;
    }).call(this);
    return {
      composition_value: composition_value,
      composition_value_operations: composition_value_operations
    };
  };

  YSelections.prototype._setCompositionValue = function(composition_value) {
    var i, len, results, value;
    results = [];
    for (i = 0, len = composition_value.length; i < len; i++) {
      value = composition_value[i];
      value.type = "select";
      results.push(this._apply(value));
    }
    return results;
  };

  YSelections.prototype._apply = function(delta) {
    var a, attr, attr_list, createSelection, cut_off_from, cut_off_to, delta_has_attrs, elem, elem_next, end, extendSelection, from, i, j, len, len1, listener, n, observer_call, p, parent, parent_exists, ref1, ref2, ref3, selection, selection_is_empty, start, to, to_next, undos, v;
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
      ref1 = this._lists;
      for (i = 0, len = ref1.length; i < len; i++) {
        p = ref1[i];
        if (parent === this._lists[p]) {
          parent_exists = true;
          break;
        }
      }
      if (!parent_exists) {
        this._lists.push(parent);
        parent.observe((function(_this) {
          return function(events) {
            var event, j, len1, next, prev, ref, results, sel;
            results = [];
            for (j = 0, len1 = events.length; j < len1; j++) {
              event = events[j];
              if (event.type === "delete") {
                if (event.reference.selection != null) {
                  ref = event.reference;
                  sel = ref.selection;
                  delete ref.selection;
                  if (sel.from === ref && sel.to === ref) {
                    _this._removeFromCompositionValue(sel);
                  } else if (sel.from === ref) {
                    next = ref.getNext();
                    sel.from = next;
                    next.selection = sel;
                  } else if (sel.to === ref) {
                    prev = ref.getPrev();
                    sel.to = prev;
                    prev.selection = sel;
                  } else {
                    throw new Error("Found weird inconsistency! Y.Selections is no longer safe to use!");
                  }
                }
                next = event.reference.getNext();
                if (next.selection != null) {
                  results.push(_this._combine_selection_to_left(next.selection));
                } else {
                  results.push(void 0);
                }
              } else {
                results.push(void 0);
              }
            }
            return results;
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
    ref2 = this._listeners;
    for (j = 0, len1 = ref2.length; j < len1; j++) {
      listener = ref2[j];
      listener.call(this, observer_call);
    }
    createSelection = (function(_this) {
      return function(from, to, attrs) {
        var key, new_attrs, new_sel, value;
        new_attrs = {};
        for (key in attrs) {
          value = attrs[key];
          new_attrs[key] = value;
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
      var k, key, len2, n, ref3, ref4, ref5, undo_attrs, undo_attrs_list, undo_need_select, undo_need_unselect, v, value;
      if (delta.type === "unselect") {
        undo_attrs = {};
        ref3 = delta.attrs;
        for (k = 0, len2 = ref3.length; k < len2; k++) {
          key = ref3[k];
          if (selection.attrs[key] != null) {
            undo_attrs[key] = selection.attrs[key];
          }
          delete selection.attrs[key];
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
          ref4 = selection.attrs;
          for (key in ref4) {
            value = ref4[key];
            if (delta.attrs[n] == null) {
              undo_need_select = true;
              undo_attrs[key] = value;
            }
          }
          for (n in undo_attrs) {
            v = undo_attrs[n];
            delete selection.attrs[key];
          }
        }
        ref5 = delta.attrs;
        for (key in ref5) {
          value = ref5[key];
          if (selection.attrs[key] != null) {
            undo_attrs[key] = selection.attrs[key];
            undo_need_select = true;
          } else {
            undo_attrs_list.push(key);
            undo_need_unselect = true;
          }
          selection.attrs[key] = value;
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
      var element, new_selection, old_selection, opt_selection;
      if ((from.selection != null) && from.selection.from === from) {
        return;
      }
      element = from.prev_cl;
      while ((element.selection == null) && (element.type !== "Delimiter")) {
        element = element.prev_cl;
      }
      if ((element.selection == null) || element.selection.to === element) {
        return;
      }
      old_selection = element.selection;
      element = from;
      while ((element !== old_selection.to) && (element !== to)) {
        element = element.getNext();
      }
      if (element === old_selection.to) {
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
      var element, new_selection, old_selection;
      if ((to.selection != null) && to.selection.to === to) {
        return;
      }
      element = to;
      while ((element.selection == null) && (element !== from)) {
        element = element.getPrev();
      }
      if ((element.selection == null) || element.selection["to"] === element) {
        return;
      }
      old_selection = element.selection;
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
    elem = from;
    to_next = to.getNext();
    while (elem !== to_next) {
      if (elem.selection != null) {
        extendSelection(elem.selection, delta);
        selection = elem.selection;
        this._combine_selection_to_left(selection);
        elem = selection.to.getNext();
        selection_is_empty = true;
        for (attr in selection.attrs) {
          selection_is_empty = false;
          break;
        }
        if (selection_is_empty) {
          this._removeFromCompositionValue(selection);
        }
      } else {
        start = elem;
        elem_next = elem.getNext();
        while ((elem_next.selection == null) && (elem !== to)) {
          elem = elem_next;
          elem_next = elem.getNext();
        }
        end = elem;
        if (delta.type !== "unselect" && delta_has_attrs) {
          attr_list = [];
          ref3 = delta.attrs;
          for (n in ref3) {
            v = ref3[n];
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
          this._combine_selection_to_left(elem.selection);
        }
        elem = elem.getNext();
      }
    }
    if (elem.selection != null) {
      this._combine_selection_to_left(elem.selection);
    }
    if (from.selection != null) {
      this._combine_selection_to_left(from.selection);
    }
    return undos;
  };

  YSelections.prototype._removeFromCompositionValue = function(selectionToRemove) {
    this._composition_value = this._composition_value.filter(function(sel) {
      return sel !== selectionToRemove;
    });
    delete selectionToRemove.from.selection;
    return delete selectionToRemove.to.selection;
  };

  YSelections.prototype._combine_selection_to_left = function(sel) {
    var first_elem, new_from;
    first_elem = sel.from.getPrev();
    if (first_elem.selection == null) {

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
    var delta, i, len;
    for (i = 0, len = deltas.length; i < len; i++) {
      delta = deltas[i];
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
    var attrs, element, key, number_of_attrs, pos, ref1, result, sel_start, value;
    element = list.ref(0);
    if (element == null) {
      return [];
    }
    sel_start = null;
    pos = 0;
    result = [];
    while (element.next_cl != null) {
      if (element.isDeleted()) {
        if (element.selection != null) {
          console.log("You forgot to delete the selection from this operation! Please write an issue how to reproduce this bug! (it could lead to inconsistencies!)");
        }
        element = element.next_cl;
        continue;
      }
      if (element.selection != null) {
        if (element.selection.from === element) {
          if (sel_start != null) {
            throw new Error("Found two consecutive from elements. The selections are no longer safe to use! (contact the owner of the repository)");
          } else {
            sel_start = pos;
          }
        }
        if (element.selection.to === element) {
          if (sel_start != null) {
            number_of_attrs = 0;
            attrs = {};
            ref1 = element.selection.attrs;
            for (key in ref1) {
              value = ref1[key];
              attrs[key] = value;
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
        } else if (element.selection.from !== element) {
          throw new Error("This reference should not point to this selection, because the selection does not point to the reference. The selections are no longer safe to use! (contact the owner of the repository)");
        }
      }
      pos++;
      element = element.next_cl;
    }
    return result;
  };

  YSelections.prototype.observe = function(fun) {
    return this._listeners.push(fun);
  };

  YSelections.prototype.unobserve = function(fun) {
    return this._listeners = this._listeners.filter(function(otherFun) {
      return fun !== otherFun;
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
