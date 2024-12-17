#' Plot the map of Germany
#'
#' @description
#' Plots the map of Germany.
#'
#'
#' @param data Data frame. Data to be displayed.
#' @param config List. Configuration object for the display.
#' @param width Character. Width of the app.
#' @param height Character. Height of the app.
#' @param elementId Character. Id of the app.
#'
#' @import htmlwidgets
#'
#' @examples
#' # eatMap()
#'
#' @export
eatMap <- function(data, config, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = purrr::list_transpose(as.list(data)),
    config = config
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
eatMapOutput <- function(outputId, width = '50%', height = '50px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'eatMap', width, height, package = 'eatMap')
}

#' @rdname eatMap-shiny
#' @export
renderEatMap <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, eatMapOutput, env, quoted = TRUE)
}
