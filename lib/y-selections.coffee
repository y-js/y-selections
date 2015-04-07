


class YSelections
  constructor: ()->

  _name: "Selections"

  _getModel: (Y, Operation) ->
    if not @_model?
      @_model = new Operation.Composition(@, []).execute()
    @_model

  _setModel: (@_model)->

  _apply: (delta)->
    # TODO: currently, applies the delta _as is_.
    from = @_model.HB.getOperation delta.from
    to = @_model.HB.getOperation delta.to
    createSelection: (from, to, attrs)->
      return
        from: from
        to: to
        attrs: attrs

    extendSelection: (selection, attrs)->
      for n,v of attrs
        selection.attrs[n] = v

    if not (from? and to?)
      console.log "wasn't able to apply the selection.."
    if delta.type is "select"
      # Algorithm overview:
      # 1. cut off the selection that intersects with from
      # 2. cut off the selection that intersects with to
      # 3. extend / add selections in between

      # e.g.           from     , "from"        , "prev_cl", "to"
      cut_selection : (reference, reference_name, direction, opposite_reference_name)->
        if reference.selection? and reference.selection[reference_name] is reference
          return
        o = reference[direction]
        while (not o.selection?) and (o.type isnt "Delimiter")
          o = o[direction]
        if (not o.selection?) or o.selection[opposite_reference_name] is o
          return
        old_selection = o.selection
        new_selection = createSelection old_selection.from, reference[direction], delta.attrs
        

      left_sel = null
      right_sel = null

      # 1. check if there is a selection to the left
      left_sel = from
      while (not from_left_sel.selection?) and (from_left_sel.type isnt "Delimiter")
        from_left_sel = from_left_sel.prev_cl
      # 2. check if there is a selection to the right
      right_sel = to
      while (not from_right_sel.selection?) and (from_right_sel isnt to)
        from_right_sel = from_right_sel.next_cl

      if (from_left_sel.selection.to is from_left_sel) or (from_left_sel.type is "Delimiter")
        # from_left_sel is the end of an selection (or no selection), and there is no intersection to the left
        if from_right_sel.selection is to
          # No intersection!
          from.selection = selection
          to.selection = selection
        else
          # the right part of this selection intersects with another selection
          selection.to = from_right_sel.prev_cl
      else
        
      from.selection = selection
      to.selection = selection
    else if delta.type is "unselect"
      # ..
    else
      throw new Error "unsupported delta!"
    return delta # it is necessary that delta is returned in the way it was applied on the global delta.
    # so that yjs can know exactly what was applied.

  # "undo" a delta from the composition_value
  _unapply: (delta)->
    from = @_model.HB.getOperation delta.from
    to = @_model.HB.getOperation delta.to
    if not (from? and to?)
      console.log "wasn't able to unapply the selection.."
    if delta.type is "select"
      delete from.selection
      delete to.selection
    else if delta.type is "unselect"
      # ..
    else
      throw new Error "unsupported delta!"

  # update the globalDelta with delta


  # select _from_, _to_ with an _attribute_
  select: (from, to, attrs)->
    delta = # probably not as easy as this
      from: from.getUid()
      to: to.getUid()
      attrs: attrs
      type: "select"

    @_model.applyDelta(delta)

  # unselect _from_, _to_ with an _attribute_
  unselect: (from, to, attrs)->
    delta = # probably not as easy as this
      from: from.getUid()
      to: to.getUid()
      attrs: attrs
      type: "unselect"

    @_model.applyDelta(delta)

  observe: (f)->
    @_model.observe f


if window?
  if window.Y?
    window.Y.Selections = YSelections
  else
    throw new Error "You must first import Y!"

if module?
  module.exports = YSelections






