/*jshint globalstrict:true */
/*global angular:true */

/*

  ## Fields (DEPRECATED)


  ### Parameters
  * style :: a hash containing css styles
  * arrange :: the layout pf the panel 'horizontal' or 'vertical'
  * micropanel_position :: where to place the micropanel in relation to the field
  
  ### Group Events
  #### Recieves
  * table_documents :: An object containing the documents in the table panel
  #### Sends
  * fields :: an object containing the sort order, existing fields and selected fields

*/

'use strict';

angular.module('kibana.fields', [])
.controller('fields', function($scope, eventBus, $timeout, dashboard, filterSrv) {

  $scope.panelMeta = {
    status  : "Deprecated",
    description : "You should not use this table, it does not work anymore. The table panel now"+
      "integrates a field selector. This module will soon be removed."
  };


  // Set and populate defaults
  var _d = {
    group   : "default",
    style   : {},
    arrange : 'vertical',
    micropanel_position : 'right', 
  };
  _.defaults($scope.panel,_d);

  $scope.init = function() {
    $scope.Math = Math;
    $scope.fields = [];
    eventBus.register($scope,'fields', function(event, fields) {
      $scope.panel.sort = _.clone(fields.sort);
      $scope.fields     = fields.all;
      $scope.active     = _.clone(fields.active);
    });
    eventBus.register($scope,'table_documents', function(event, docs) {
      $scope.panel.query = docs.query;
      $scope.docs = docs.docs;
      $scope.index = docs.index;
    });
    eventBus.register($scope,"get_fields", function(event,id) {
      eventBus.broadcast($scope.$id,$scope.panel.group,"selected_fields",$scope.active);
    });
  };

  $scope.reload_list = function () {
    var temp = _.clone($scope.fields);
    $scope.fields = [];    
    $timeout(function(){
      $scope.fields = temp;
    },10);
    
  };

  $scope.toggle_micropanel = function(field) {
    $scope.micropanel = {
      field: field,
      values : kbn.top_field_values($scope.docs,field,10),
      related : kbn.get_related_fields($scope.docs,field),
      count: _.countBy($scope.docs,function(doc){return _.contains(_.keys(doc),field);})['true']
    };
  };

  $scope.toggle_sort = function() {
    $scope.panel.sort[1] = $scope.panel.sort[1] === 'asc' ? 'desc' : 'asc';
  };

  $scope.toggle_field = function(field) {
    if (_.indexOf($scope.active,field) > -1) {
      $scope.active = _.without($scope.active,field);
    } else {
      $scope.active.push(field);
    }
    eventBus.broadcast($scope.$id,$scope.panel.group,"selected_fields",$scope.active);
  };

  $scope.build_search = function(field,value,mandate) {
    var query;
    if(_.isArray(value)) {
      query = field+":(" + _.map(value,function(v){return "\""+v+"\"";}).join(",") + ")";
    } else {
      query = field+":"+angular.toJson(value);
    }    
    filterSrv.set({type:'querystring',query:query,mandate:mandate});
    dashboard.refresh();
  };

  $scope.fieldExists = function(field,mandate) {
    filterSrv.set({type:'exists',field:field,mandate:mandate});
    dashboard.refresh();
  };

  $scope.is_active = function(field) {
    return _.indexOf($scope.active,field) > -1 ? ['label','label-info'] : '';    
  };

});