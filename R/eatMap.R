#' Plot a card.
#'
#' <Add Description>
#'
#' @import htmlwidgets
#'
#' @export
eatMap <- function(data, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = purrr::list_transpose(as.list(data))
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'eatMap',
    x,
    width = width,
    height = height,
    package = 'eatMap',
    elementId = elementId
  )
}

#' Shiny bindings for eatMap
#'
#' Output and render functions for using eatMap within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a eatMap
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name eatMap-shiny
#'
#' @export
eatMapOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'eatMap', width, height, package = 'eatMap')
}

#' @rdname eatMap-shiny
#' @export
renderEatMap <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, eatMapOutput, env, quoted = TRUE)
}
