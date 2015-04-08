var YSelections;

YSelections = (function() {
  function YSelections() {}

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

  YSelections.prototype._apply = function(delta) {
    var count, createSelection, cut_selection, end, extendSelection, from, o, selection, start, to;
    from = this._model.HB.getOperation(delta.from);
    to = this._model.HB.getOperation(delta.to);
    createSelection = function(from, to, attrs) {
      var n, new_attrs, v;
      new_attrs = {};
      for (n in attrs) {
        v = attrs[n];
        new_attrs[n] = v;
      }
      return {
        from: from,
        to: to,
        attrs: new_attrs
      };
    };
    extendSelection = function(selection, attrs) {
      var n, results, v;
      results = [];
      for (n in attrs) {
        v = attrs[n];
        results.push(selection.attrs[n] = v);
      }
      return results;
    };
    if (!((from != null) && (to != null))) {
      console.log("wasn't able to apply the selection..");
    }
    if (delta.type === "select") {
      cut_selection = function(reference, reference_name, direction, opposite_direction, opposite_reference, opposite_reference_name) {
        var new_selection, o, old_selection, opt_selection;
        if ((reference.selection != null) && reference.selection[reference_name] === reference) {
          return;
        }
        o = reference[direction];
        while ((o.selection == null) && (o.type !== "Delimiter")) {
          o = o[direction];
        }
        if ((o.selection == null) || o.selection[opposite_reference_name] === o) {
          return;
        }
        old_selection = o.selection;
        o = reference;
        while ((o.selection == null) && (o !== opposite_reference)) {
          o = o[direction];
        }
        if (o === old_selection[opposite_reference_name]) {
          if (opposite_reference_name === "to") {
            new_selection = createSelection(reference, old_selection[opposite_reference_name], old_selection.attrs);
          } else {
            new_selection = createSelection(old_selection[opposite_reference_name], reference, old_selection.attrs);
          }
          extendSelection(new_selection, delta.attrs);
          old_selection[opposite_reference_name] = reference[direction];
          old_selection[opposite_reference_name].selection = old_selection;
          new_selection[reference_name].selection = new_selection;
          return new_selection[opposite_reference_name].selection = new_selection;
        } else {
          if (opposite_reference_name === "to") {
            new_selection = createSelection(reference, opposite_reference, old_selection.attrs);
          } else {
            new_selection = createSelection(opposite_reference, reference, old_selection.attrs);
          }
          extendSelection(new_selection, delta.attrs);
          if (opposite_reference_name === "to") {
            opt_selection = createSelection(opposite_reference[opposite_direction], old_selection[opposite_reference_name], old_selection.attrs);
          } else {
            opt_selection = createSelection(old_selection[opposite_reference_name], opposite_reference[opposite_direction], old_selection.attrs);
          }
          old_selection[opposite_reference_name] = reference[direction];
          old_selection[opposite_reference_name].selection = old_selection;
          new_selection[reference_name].selection = new_selection;
          new_selection[opposite_reference_name].selection = new_selection;
          opt_selection[reference_name].selection = opt_selection;
          return opt_selection[opposite_reference_name].selection = opt_selection;
        }
      };
      ({
        cut_selection: function(reference, reference_name, direction, opposite_direction, opposite_reference, opposite_reference_name) {}
      });
      cut_selection(from, "from", "prev_cl", "next_cl", to, "to");
      cut_selection(to, "to", "next_cl", "prev_cl", from, "from");
      o = from;
      count = 0;
      while ((o !== to.next_cl) || count > 10) {
        count++;
        if (o.selection != null) {
          extendSelection(o.selection, delta.attrs);
          o = o.selection.to.next_cl;
        } else {
          start = o;
          while (o !== to) {
            o = o.next_cl;
          }
          end = o;
          selection = createSelection(start, end, delta.attrs);
          start.selection = selection;
          end.selection = selection;
          o = o.next_cl;
        }
      }
    } else if (delta.type === "unselect") {

    } else {
      throw new Error("unsupported delta!");
    }
    return delta;
  };

  YSelections.prototype._unapply = function(delta) {
    var from, to;
    from = this._model.HB.getOperation(delta.from);
    to = this._model.HB.getOperation(delta.to);
    if (!((from != null) && (to != null))) {
      console.log("wasn't able to unapply the selection..");
    }
    if (delta.type === "select") {
      delete from.selection;
      return delete to.selection;
    } else if (delta.type === "unselect") {

    } else {
      throw new Error("unsupported delta!");
    }
  };

  YSelections.prototype.select = function(from, to, attrs) {
    var delta;
    delta = {
      from: from.getUid(),
      to: to.getUid(),
      attrs: attrs,
      type: "select"
    };
    return this._model.applyDelta(delta);
  };

  YSelections.prototype.unselect = function(from, to, attrs) {
    var delta;
    delta = {
      from: from.getUid(),
      to: to.getUid(),
      attrs: attrs,
      type: "unselect"
    };
    return this._model.applyDelta(delta);
  };

  YSelections.prototype.observe = function(f) {
    return this._model.observe(f);
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
