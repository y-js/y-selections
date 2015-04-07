


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
    createSelection = (from, to, attrs)->
      new_attrs = {}
      for n,v of attrs
        new_attrs[n] = v
      {
        from: from
        to: to
        attrs: new_attrs
      }

    extendSelection = (selection, attrs)->
      for n,v of attrs
        selection.attrs[n] = v

    if not (from? and to?)
      console.log "wasn't able to apply the selection.."
    if delta.type is "select"
      # Algorithm overview:
      # 1. cut off the selection that intersects with from
      # 2. cut off the selection that intersects with to
      # 3. extend / add selections in between

      # e.g.           from     , "from"        , "prev_cl", "next_cl"         , to                , "to"
      cut_selection = (reference, reference_name, direction, opposite_direction, opposite_reference, opposite_reference_name)->
        if reference.selection? and reference.selection[reference_name] is reference
          # does not intersect, because the start is already selected
          return
        o = reference[direction]
        while (not o.selection?) and (o.type isnt "Delimiter")
          o = o[direction]
        if (not o.selection?) or o.selection[opposite_reference_name] is o
          # no intersection
          return

        # this is a reference for the selections that are created:
        # old is outer (not between $from $to)
        # new is inner (inbetween $from $to)
        # opt is outer in opposite_direction
        #
        old_selection = o.selection

        # check if found selection intersects with opposite_reference
        o = reference
        while (not o.selection?) and (o isnt opposite_reference)
          o = o[direction]
        if o is old_selection[opposite_reference_name]
          # no intersection with opposite_reference!
          # create new selection
          new_selection = createSelection reference, old_selection[opposite_reference_name], old_selection.attrs
          extendSelection new_selection, delta.attrs
          # update old selection
          old_selection[opposite_reference_name] = reference[direction]
          # update references
          old_selection[opposite_reference_name].selection = old_selection
          new_selection[reference_name].selection = new_selection
          new_selection[opposite_reference_name].selection = new_selection
        else
          # there is an intersection with opposite_reference!
          # create new selection
          new_selection = createSelection reference, opposite_reference, old_selection.attrs
          extendSelection new_selection, delta.attrs
          opt_selection = createSelection opposite_reference[opposite_direction], old_selection[opposite_reference_name], old_selection.attrs
          # update old selection
          old_selection[opposite_reference_name] = reference[direction]
          # update references
          old_selection[opposite_reference_name].selection = old_selection
          new_selection[reference_name].selection = new_selection
          new_selection[opposite_reference_name].selection = new_selection
          opt_selection[reference_name].selection = opt_selection
          opt_selection[opposite_reference_name].selection = opt_selection

      # 1. cut off the selection that intersects with from
      # e.g.           from     , "from"        , "prev_cl", "next_cl"         , to                , "to"
      cut_selection : (reference, reference_name, direction, opposite_direction, opposite_reference, opposite_reference_name)->
      cut_selection(from, "from", "prev_cl", "next_cl", to  , "to")
      # 2. cut off the selection that intersects with to
      cut_selection(to  , "to"  , "next_cl", "prev_cl", from, "from")
      # 3. extend / add selections in between
      o = from
      while o isnt to.next_cl
        if o.selection?
          # just extend the existing selection
          extendSelection o.selection, delta.attrs
          o = o.selection.to.next_cl
        else
          # create a new selection (until you find the next one)
          start = o
          while o isnt to
            o = o.next_cl
          end = o
          selection = createSelection start, end, delta.attrs
          start.selection = selection
          end.selection = selection
          o = o.next_cl

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






