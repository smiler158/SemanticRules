
#Import SMW, SMWHalo
include_once('extensions/SemanticMediaWiki/includes/SMW_Settings.php');
enableSemantics('http://wiki', true);
 
include_once('extensions/SMWHalo/includes/SMW_Initialize.php');
enableSMWHalo('SMWHaloStore2', 'SMWTripleStore', 'http://publicbuild/ob');
$smwgWebserviceEndpoint="localhost:8090";
$smwhgAutoCompletionTSC=true;

#SemanticRules
require_once('extensions/SemanticRules/includes/SR_Initialize.php');