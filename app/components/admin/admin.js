'use strict';

angular.module('bars.admin', [
    ])

.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('bar.admin', {
            url: "/admin",
            views: {
                '@bar': {
                    templateUrl: "components/admin/layout.html",
                    controller: 'admin.ctrl.base'
                },
                '@bar.admin': {
                    templateUrl: "components/admin/dashboard.html",
                    controller: 'admin.ctrl.home',
                    resolve: {
                        account_list: ['api.models.account', function(Account) {
                            return Account.all();
                        }],
                        food_list: ['api.models.food', function(Food){
                            return Food.all();
                        }]
                    }
                }
            }
        })
        .state('bar.admin.food', {
            url: "/food",
            templateUrl: "components/admin/food/home.html",
            controller: 'admin.ctrl.food'
        })
        .state('bar.admin.account', {
            url: "/account",
            templateUrl: "components/admin/account/home.html",
            controller: 'admin.ctrl.account'
        })
        ;
}])

.controller('admin.ctrl.base',
    ['$scope',
    function($scope) {
        $scope.bar.active = 'admin';
        $scope.admin = {
            active: ''
        };
    }
])
.controller('admin.ctrl.home',
    ['$scope', 'account_list', 'food_list',
    function($scope, account_list, food_list) {
        $scope.admin.active = 'dashboard';
        new Morris.Line({
            // ID of the element in which to draw the chart.
            element: 'graph1',
            // Chart data records -- each entry in this array corresponds to a point on
            // the chart.
            data: [
            { year: '2008', value: 20 },
            { year: '2009', value: 10 },
            { year: '2010', value: 5 },
            { year: '2011', value: 5 },
            { year: '2012', value: 20 }
            ],
            // The name of the data record attribute that contains x-values.
            xkey: 'year',
            // A list of names of data record attributes that contain y-values.
            ykeys: ['value'],
            // Labels for the ykeys -- will be displayed when you hover over the
            // chart.
            labels: ['Value'],
            smooth: false
        });

        $scope.nbAccountNegativ = _.filter(account_list, function (o) {
            return o.money <= 0;
        }).length;
        $scope.ratioAccountNegativ = $scope.nbAccountNegativ/account_list.length;

        $scope.nbFoodNegativ = _.filter(food_list, function (o) {
            return o.qty <= 0;
        }).length;
        $scope.ratioFoodNegativ = $scope.nbFoodNegativ/food_list.length;
    }
])
.controller('admin.ctrl.food',
    ['$scope', 'api.models.food', 'admin.appro', 'admin.inventory',
    function($scope, Food, Appro, Inventory) {
        $scope.admin.active = 'food';
        $scope.food = Food.create();
        $scope.addFood = function() {
            $scope.food.buy_unit_value = 1;
            $scope.food.qty = $scope.food.qty/$scope.food.unit_value;
            $scope.food.unit_value = 1/$scope.food.unit_value;
            $scope.food.bar = 'avironjone'; // [TODO]Adapter bars-django
            $scope.food.$save().then(function(newFood) {
                $scope.food = Food.create();
            }, function(errors) {
                // TODO: display form errors
            });
        };
        $scope.appro = Appro;
        $scope.formAppro = Appro.in();

        $scope.inventory = Inventory;
        $scope.formInventory = Inventory.in();
    }
])
.controller('admin.ctrl.account',
    ['$scope', 'api.models.account', 'api.models.user',
    function($scope, Account, User) {
        $scope.admin.active = 'account';
    }
])
.factory('admin.appro',
    ['api.models.food', 'api.services.action',
    function (Food, APIAction) {
        return {
            itemsList: [],
            totalPrice: 0,
            inRequest: false,
            itemToAdd: "",
            init: function() {
                this.itemsList = [];
                this.totalPrice = 0;
                this.inRequest = false;
            },
            recomputeAmount: function() {
                var nbItems = this.itemsList.length;

                var totalPrice = 0;
                _.forEach(this.itemsList, function(item, i) {
                    totalPrice += item.item.price * item.qty * item.unit_value;
                });

                this.totalPrice = totalPrice;
            },
            addItem: function(item, qty) {
                if (!qty) {
                    qty = item.unit_value;
                }
                var other = _.find(this.itemsList, {'item': item});
                if (other) {
                    other.qty += qty/item.unit_value;
                } else {
                    this.itemsList.push({ item: item, qty: qty/item.unit_value, unit_value: item.buy_unit_value });
                }
                this.recomputeAmount();
                this.itemToAdd = "";
            },
            removeItem: function(item) {
                this.itemsList.splice(this.itemsList.indexOf(item), 1);
                this.recomputeAmount();
            },
            validate: function() {
                this.inRequest = true;
                _.forEach(this.itemsList, function(item, i) {
                    item.qty = item.qty * item.unit_value;
                });
                var refThis = this;
                APIAction.appro({
                    items: this.itemsList
                })
                .then(function() {
                    refThis.init();
                });
            },
            in: function() {
                return this.itemsList.length > 0;
            }
        };
    }]
)
.factory('admin.inventory',
['api.models.food', 'api.services.action',
function (Food, APIAction) {
    return {
        itemsList: [],
        inRequest: false,
        itemToAdd: "",
        init: function() {
            this.itemsList = [];
            this.inRequest = false;
        },
        addItem: function(item, qty) {
            if (!qty) {
                qty = item.unit_value;
            }
            var other = _.find(this.itemsList, {'item': item});
            if (other) {
                other.qty += qty/item.unit_value;
            } else {
                this.itemsList.push({ item: item, qty: qty/item.unit_value, unit_value: item.buy_unit_value });
            }
            this.itemToAdd = "";
        },
        removeItem: function(item) {
            this.itemsList.splice(this.itemsList.indexOf(item), 1);
        },
        validate: function() {
            this.inRequest = true;
            _.forEach(this.itemsList, function(item, i) {
                item.qty = item.qty * item.unit_value;
            });
            var refThis = this;
            APIAction.inventory({
                items: this.itemsList
            })
            .then(function() {
                refThis.init();
            });
        },
        in: function() {
            return this.itemsList.length > 0;
        }
    };
}]
)
;
