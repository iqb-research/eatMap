
# WORKFLOW & TEST SCRIPT FOR MAKING CHANGES IN eatMap

# Setup ------------------------------------------------------------------------
library(BTShinyApp)
BTdata <- readRDS(system.file("extdata", "BTdata_processed.Rds", package = "BTShinyApp"))
load(system.file("extdata", "ui_variables.rda", package = "BTShinyApp"))

# Data selection ---------------------------------------------------------------

data <- data.frame(BTdata$de)

data <- data[data$cycle == "9. Klasse: Sprachen" &
               data$parameter == "mean" &
               data$year == 2022 &
               data$fachKb == "Deutsch-Lesen" &
               data$targetPop == "alle",]

# Bundle changes ---------------------------------------------------------------

# Now make changes in eatMap\srcjs\modules

#devtools::document()
#devtools::load_all()

#install.packages("packer")
#packer::npm_install()

packer::bundle()

# ... bundles the changes into eatMap\inst\htmlwidgets

# Test the map -----------------------------------------------------------------

eatMap(data, config$de, lang = "en")
