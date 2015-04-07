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
    var from, from_left_sel, from_right_sel, left_sel, right_sel, selection, to;
    from = this._model.HB.getOperation(delta.from);
    to = this._model.HB.getOperation(delta.to);
    selection = {
      from: from,
      to: to,
      attr: delta.attr
    };
    if (!((from != null) && (to != null))) {
      console.log("wasn't able to apply the selection..");
    }
    if (delta.type === "select") {
      left_sel = null;
      right_sel = null;
      left_sel = from;
      while ((from_left_sel.selection == null) && (from_left_sel.type !== "Delimiter")) {
        from_left_sel = from_left_sel.prev_cl;
      }
      right_sel = to;
      while ((from_right_sel.selection == null) && (from_right_sel !== to)) {
        from_right_sel = from_right_sel.next_cl;
      }
      if ((from_left_sel.selection.to === from_left_sel) || (from_left_sel.type === "Delimiter")) {
        if (from_right_sel.selection === to) {
          from.selection = selection;
          to.selection = selection;
        } else {
          selection.to = from_right_sel.prev_cl;
        }
      } else {

      }
      from.selection = selection;
      to.selection = selection;
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

  YSelections.prototype.select = function(from, to, attribute) {
    var delta;
    delta = {
      from: from.getUid(),
      to: to.getUid(),
      attr: attribute,
      type: "select"
    };
    return this._model.applyDelta(delta);
  };

  YSelections.prototype.unselect = function(from, to, attribute) {
    var delta;
    delta = {
      from: from.getUid(),
      to: to.getUid(),
      attr: attribute,
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
