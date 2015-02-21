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
                        food_list: ['api.models.food', function(Food) {
                            return Food.all();
                        }],
                        bar_account: ['api.models.account', function(Account) {
                            return Account.ofUser(6);
                        }],
                        bar: ['api.models.bar', '$stateParams', function(Bar, $stateParams) {
                            return Bar.get($stateParams.bar);
                        }]
                    }
                }
            }
        })
        // Admin food
        .state('bar.admin.food', {
            abstract: true,
            url: "/food",
            controller: 'admin.ctrl.food',
            template: '<ui-view />'
        })
            .state('bar.admin.food.add', {
                url: "/add",
                templateUrl: "components/admin/food/add.html",
                controller: 'admin.ctrl.food.add'
            })
            .state('bar.admin.food.appro', {
                url: "/appro",
                templateUrl: "components/admin/food/appro.html",
                controller: 'admin.ctrl.food.appro'
            })
            .state('bar.admin.food.inventory', {
                url: "/inventory",
                templateUrl: "components/admin/food/inventory.html",
                controller: 'admin.ctrl.food.inventory'
            })
            .state('bar.admin.food.graphs', {
                url: "/graphs",
                templateUrl: "components/admin/food/graphs.html",
                controller: 'admin.ctrl.food.graphs'
            })
        // Admin account
        .state('bar.admin.account', {
            url: '/account',
            abstract: true,
            template: "<ui-view />",
            controller: 'admin.ctrl.account'
        })
            .state('bar.admin.account.add', {
                url: '/add',
                templateUrl: "components/admin/account/add.html",
                controller: 'admin.ctrl.account.add'
            })
            .state('bar.admin.account.link', {
                url: '/link',
                templateUrl: "components/admin/account/link.html",
                controller: 'admin.ctrl.account.link',
                resolve: {
                    user_list: ['api.models.user', function(User) {
                        return User.all();
                    }]
                }
            })
            .state('bar.admin.account.collectivePayment', {
                url: '/fist',
                templateUrl: "components/admin/account/collectivePayment.html",
                controller: 'admin.ctrl.account.collectivePayment',
                resolve: {
                    account_list: ['api.models.account', function(Account) {
                        return Account.all();
                    }]
                }
            })
        // Admin news
        .state('bar.admin.news', {
            abstract: true,
            url: "/news",
            template: '<ui-view />'
        })
            .state('bar.admin.news.next-appro', {
                url: '/next-appro',
                templateUrl: "components/admin/news/next-appro.html",
                controller: 'admin.ctrl.news.next-appro'
            })
            .state('bar.admin.news.add', {
                url: '/add',
                templateUrl: "components/admin/news/form.html",
                controller: 'admin.ctrl.news.add'
            })
            .state('bar.admin.news.list', {
                url: '/list',
                templateUrl: "components/admin/news/list.html",
                controller: 'admin.ctrl.news.list',
                resolve: {
                    news_list: ['api.models.news', function(News) {
                        return News.all();
                    }]
                }
            })
            .state('bar.admin.news.edit', {
                url: '/edit/:id',
                templateUrl: "components/admin/news/form.html",
                controller: 'admin.ctrl.news.edit'
            })
        // Admin settings
        .state('bar.admin.settings', {
            url: "/settings",
            templateUrl: "components/admin/settings/home.html",
            controller: 'admin.ctrl.settings',
            resolve: {
                bar: ['api.models.bar' , '$stateParams', function(Bar, $stateParams) {
                    return Bar.get($stateParams.bar);
                }]
            }
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
    ['$scope', 'account_list', 'food_list', 'bar_account', 'bar',
    function($scope, account_list, food_list, bar_account, bar) {
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

        var foodValue = _.reduce(food_list, function (total, f) {
            if (!f.deleted) {
                total += f.qty * f.price;
            }
            return total;
        }, 0);
        var accountsValue = _.reduce(account_list, function (total, a) {
            if (!a.deleted) {
                if (a.owner.username == 'bar') {
                    total += a.money;
                } else {
                    total -= a.money;
                }
            }
            return total;
        }, 0);
        $scope.money = foodValue + accountsValue;

        if (bar_account.length == 1) {
            $scope.bar_account = bar_account[0];
        }

        function dateDiff(date1, date2){
            var diff = {}                           // Initialisation du retour
            var tmp = date2 - date1;
         
            tmp = Math.floor(tmp/1000);             // Nombre de secondes entre les 2 dates
            diff.sec = tmp % 60;                    // Extraction du nombre de secondes
         
            tmp = Math.floor((tmp-diff.sec)/60);    // Nombre de minutes (partie entière)
            diff.min = tmp % 60;                    // Extraction du nombre de minutes
         
            tmp = Math.floor((tmp-diff.min)/60);    // Nombre d'heures (entières)
            diff.hour = tmp % 24;                   // Extraction du nombre d'heures
             
            tmp = Math.floor((tmp-diff.hour)/24);   // Nombre de jours restants
            diff.day = tmp;
             
            return diff.day;
        }
        var now = new Date();
        var approDate = new Date(bar.next_scheduled_appro);
        $scope.nbDaysBeforeAppro = (now.getHours() >= approDate.getHours()) ? dateDiff(now, approDate) + 1 : dateDiff(now, approDate);
    }
])
// Admin food
.controller('admin.ctrl.food',
    ['$scope', function ($scope) {
        $scope.admin.active = 'food';
    }]
)
.controller('admin.ctrl.food.add',
    ['$scope', 'api.models.food', 'api.models.fooddetails', 'api.services.action',
    function($scope, Food, FoodDetails, APIAction) {
        $scope.food = Food.create();
        $scope.food_details = FoodDetails.create();
        $scope.food.bar = $scope.bar.id;
        var add = {};
        $scope.add = add;
        $scope.addFood = function() {
            var qty = $scope.food.qty/$scope.food.unit_value;
            add.go().then(function(newFood) {
                APIAction.appro({
                    items: [{item: newFood.id, qty: qty}]
                });
            }, function(errors) {
                // TODO: display form errors
            });
        };
    }
])
.controller('admin.ctrl.food.appro',
    ['$scope', '$modal', 'api.models.food', 'admin.appro',
    function($scope, $modal, Food, Appro) {
        $scope.appro = Appro;

        $scope.newItem = function (e) {
            if (e.which === 13) {
                if (!isNaN(Appro.itemToAdd)) {
                    var modalNewFood = $modal.open({
                        templateUrl: 'components/admin/food/modalAdd.html',
                        controller: 'admin.ctrl.food.addModal',
                        size: 'lg',
                        resolve: {
                            bar: function () {
                                return $scope.bar.id;
                            },
                            barcode: function () {
                                return Appro.itemToAdd;
                            },
                            fooddetails_list: ['api.models.fooddetails', function(FoodDetails) {
                                return FoodDetails.all();
                            }]
                        }
                    });
                    modalNewFood.result.then(function (newFood) {
                            Appro.addItem(newFood);
                        }, function () {

                    });
                }
            }
        };
    }
])
.controller('admin.ctrl.food.addModal',
    ['$scope', '$modalInstance', 'api.models.food', 'api.models.fooddetails', 'bar', 'barcode', 'fooddetails_list',
    function($scope, $modalInstance, Food, FoodDetails, bar, barcode, fooddetails_list) {
        $scope.food = Food.create();
        var food_details = _.filter(fooddetails_list, function (f) {
            return f.barcode == barcode;
        });
        if (food_details.length > 0) {
            $scope.food_details = food_details[food_details.length - 1];
            $scope.new_details = false;
        } else {
            $scope.food_details = FoodDetails.create();
            $scope.new_details = true;
            // Add OpenFoodFacts here to fill $scope.food_details
        }
        $scope.food.bar = bar;
        $scope.food_details.barcode = barcode;
        var add = {};
        $scope.add = add;
        $scope.addFood = function() {
            add.go().then(function(newFood) {
                $modalInstance.close(newFood);
            }, function(errors) {
                // TODO: display form errors
            });
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }
])
.controller('admin.ctrl.dir.barsadminfoodadd',
    ['$scope', 'api.models.food', 'api.models.fooddetails', 'api.services.action',
    function($scope, Food, FoodDetails, APIAction) {
        $scope.add.go = function() {
            $scope.food_details.unit_value = 1;
            $scope.food.qty = 0;
            $scope.food.unit_value = 1/$scope.food.unit_value;
            function saveFood(foodDetails) {
                $scope.food.details = foodDetails.id;
                $scope.food.buy_price = $scope.food.price;
                return $scope.food.$save().then(function(newFood) {
                    $scope.food = Food.create();
                    $scope.food_details = FoodDetails.create();
                    return newFood;
                }, function(errors) {
                    // TODO: display form errors
                });
            }

            if ($scope.new_details) {
                return $scope.food_details.$save().then(saveFood, function(errors) {
                    // TODO: display form errors
                });
            } else {
                return saveFood($scope.food_details);
            }
        };
        $scope.$watch('food_details.name', function (newv, oldv) {
            if ($scope.food_details.name_plural == oldv) {
                $scope.food_details.name_plural = newv;
            }
        });
        $scope.$watch('food.unit_name', function (newv, oldv) {
            if ($scope.food.unit_name_plural == oldv) {
                $scope.food.unit_name_plural = newv;
            }
        });
        $scope.$watch('food_details.unit_name', function (newv, oldv) {
            if ($scope.food_details.unit_name_plural == oldv) {
                $scope.food_details.unit_name_plural = newv;
            }
        });
    }
])
.directive('barsAdminFoodAdd', function() {
    return {
        restrict: 'E',
        scope: {
            food: '=food',
            food_details: '=foodDetails',
            add: '=add',
            new_details: '=?newDetails'
        },
        templateUrl: 'components/admin/food/formFood.html',
        controller: 'admin.ctrl.dir.barsadminfoodadd'
    };
})
.controller('admin.ctrl.food.inventory',
    ['$scope', 'api.models.food', 'admin.inventory',
    function($scope, Food, Inventory) {
        $scope.admin.active = 'food';

        $scope.inventory = Inventory;
    }
])
.controller('admin.ctrl.food.graphs',
    ['$scope', 'api.models.food',
    function($scope, Food) {
        $scope.admin.active = 'food;'
    }
])
// Admin account
.controller('admin.ctrl.account',
    ['$scope',
    function($scope) {
        $scope.admin.active = 'account';
    }
])
.controller('admin.ctrl.account.add',
    ['$scope', 'api.models.account', 'api.models.user', 'api.services.action', '$state',
    function($scope, Account, User, APIAction, $state) {
        $scope.admin.active = 'account';
        $scope.nuser = User.create();
        $scope.nuser.lastname = "";
        $scope.nuser.firstname = "";
        $scope.nuser.password = "";
        $scope.nuser.passwordBis = "";
        $scope.nuser.username = "";
        $scope.nuser.pseudo = "";
        $scope.naccount = Account.create();
        $scope.naccount.amoney = 0;
        $scope.isValidUser = function() {
            console.log("");
            var lastnameTest = $scope.nuser.lastname && $scope.nuser.lastname.length > 0;
            console.log($scope.nuser.lastname);
            var firstnameTest = $scope.nuser.firstname && $scope.nuser.firstname.length > 0;
            var usernameTest = $scope.nuser.username.length > 0;
            var pseudoTest = $scope.nuser.pseudo.length > 0;
            var pwdTest = $scope.nuser.passwordBis && $scope.nuser.password.length > 0 && $scope.nuser.password == $scope.nuser.passwordBis;
            var moneyTest = $scope.naccount.amoney && $scope.naccount.amoney >= 0;
            return lastnameTest && firstnameTest && usernameTest && pseudoTest && pwdTest && moneyTest;
        };
        $scope.createAccount = function() {
            if ($scope.nuser.password == $scope.nuser.passwordBis) {
                $scope.nuser.full_name = _.capitalize(_.trim($scope.nuser.lastname)) + " " + _.capitalize(_.trim($scope.nuser.firstname));
                delete $scope.nuser.passwordBis;
                delete $scope.nuser.lastname;
                delete $scope.nuser.firstname;
                $scope.nuser.$save().then(function(u) {
                    $scope.naccount.owner = u.id;
                    $scope.amoney = $scope.naccount.amoney;
                    delete $scope.naccount.amoney;
                    $scope.naccount.$save().then(function(a) {
                        APIAction.deposit({account: a.id, amount: $scope.amoney}).then(function() {
                            $state.go('bar.account.details', {id: a.id});
                        }, function(errors) {
                            console.log("Erreur dépôt chèque.")
                        });
                    }, function(errors) {
                        console.log("Erreur création Account.");
                    });
                }, function(errors) {
                    console.log("Erreur création User.");
                });
            } else {
                $scope.password = '';
                $scope.passwordBis = '';
                console.log("Mots de passe différents");
            }

        }
    }
])
.controller('admin.ctrl.account.link',
    ['$scope', 'api.models.account', 'api.models.user', 'api.services.action', 'user_list', '$state',
    function($scope, Account, User, APIAction, user_list, $state) {
        $scope.admin.active = 'account';
        $scope.users_list = user_list;
        $scope.user = null;
        $scope.findUser = function(usr) {
            $scope.user = usr;
        }
        $scope.account = Account.create();
        $scope.money = 0;
        $scope.createAccount = function(usr) {
            $scope.account.owner = $scope.user.id;
            $scope.account.$save().then(function(account) {
                APIAction.deposit({account: account.id, amount: $scope.money}).then(function() {
                    $state.go('bar.account.details', {id: account.id});
                }, function(errors) {
                    console.log('Erreur dépôt chèque.')
                });
            }, function(errors) {
                console.log('Erreur création Account.');
                // [TODO] Form error
            });
        }
    }
])
.controller('admin.ctrl.account.collectivePayment',
['$scope', 'account_list',
function($scope, account_list) {
    $scope.admin.active = 'account';
    $scope.account_list = account_list;
    $scope.list_order = 'owner.full_name';
    $scope.reverse = false;
    $scope.searchl = "";
    $scope.filterAccounts = function(o) {
        return o.filter($scope.searchl);
    };
    $scope.allSelected = true;
    $scope.toggleAll = function () {
        $scope.allSelected = !$scope.allSelected;
        _.map($scope.account_list, function (o) {
            o.pay = $scope.allSelected;
        });
    };
}
])
// Admin news
.controller('admin.ctrl.news.next-appro', 
    ['$scope', 'api.models.bar', 'bar', '$state', 
    function($scope, APIBar, bar, $state){
        $scope.admin.active = 'news';
        $scope.now = new Date();
        $scope.nextAppro = new Date(bar.next_scheduled_appro);
        $scope.saveNextAppro = function() {
            bar.next_scheduled_appro = $scope.nextAppro.toISOString();
            bar.$save().then(function(b) {
                $state.go('bar.admin');
            }, function(errors) {
                console.log('Something went wrong...');
            });
        };
        // Utils functions for datetimepicker
        $scope.time_change = function() {
            if ($scope.ngModel && $scope.time) {
                $scope.ngModel.setHours($scope.time.getHours(), $scope.time.getMinutes());
                $scope.ngModel = new Date($scope.ngModel);
            }
        };
        $scope.open = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened = true;
        };
    }
])
.controller('admin.ctrl.news.add',
    ['$scope', 'api.models.news', 'api.models.user', '$state',
    function($scope, News, User, $state) {
        $scope.formType = 'add';
        $scope.admin.active = 'news';
        $scope.news = News.create();
        $scope.saveNews = function() {
            $scope.news.name = $scope.news.name == '' ? 'Informations' : $scope.news.name;
            $scope.news.deleted = false;
            $scope.news.$save().then(function(newNews) {
                $state.go('bar.admin.news.list');
            }, function(errors) {
                // TODO: display form errors
            });
        };
    }
])
.controller('admin.ctrl.news.list',
    ['$scope', 'api.models.news', 'api.models.account', 'news_list',
    function($scope, News, Account, news_list) {
        $scope.admin.active = 'news';
        $scope.news_list = _.sortBy(news_list, 'last_modified');
        $scope.trash = function(news) {
            news.deleted = true;
            news.$save();
        };
        $scope.untrash = function(news) {
            news.deleted = false;
            news.$save();
        };
        $scope.upNews = function(news) {
            news.$save().then(function() {
                $scope.news_list = _.sortBy(News.all(), 'last_modified');
            });
        }
    }
])
.controller('admin.ctrl.news.edit',
    ['$scope', 'api.models.news', 'api.models.user', '$stateParams', '$state',
    function($scope, News, User, $stateParams, $state) {
        $scope.formType = 'edit';
        $scope.admin.active = 'news';
        $scope.news = News.get($stateParams.id);
        $scope.saveNews = function() {
            $scope.news.name = $scope.news.name == '' ? 'Informations' : $scope.news.name;
            $scope.news.$save().then(function(newNews) {
                $state.go('bar.admin.news.list');
            }, function(errors) {
                    // TODO: display form errors
            });
        };
    }]
)
// Admin settings
.controller('admin.ctrl.settings',
    ['$scope', 'api.models.bar', 'bar',
    function($scope, APIBar, bar) {
        $scope.admin.active = 'settings';
        // Seuil d'alerte
        $scope.moneyLimit = bar.money_warning_threshold;
        $scope.saveMoneyLimit = function() {
            if ($scope.moneyLimit >= 0) {
                bar.money_warning_threshold = $scope.moneyLimit;
                bar.$save().then(function(b) {
                    //
                }, function(errors) {
                    console.log('Erreur...');
                });
            }
        };
        // Agios
        $scope.activateAgio = false;
        $scope.graceTime = null;
        $scope.agioFormula = null;
        $scope.saveAgio = function() {
            // [TODO]
        };
    }]
)

.factory('admin.appro',
    ['api.models.food', 'api.services.action',
    function (Food, APIAction) {
        var nb = 0;
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
                    // totalPrice += item.item.price * item.qty * item.unit_value;
                    if (item.qty && item.qty > 0 && item.price && item.unit_value) {
                        item.price = item.price * item.qty * item.unit_value/(item.old_qty * item.old_unit_value);
                        item.old_qty = item.qty;
                        item.old_unit_value = item.unit_value;
                    }
                    totalPrice += item.price;
                });

                this.totalPrice = totalPrice;
            },
            addItem: function(item, qty) {
                if (!qty) {
                    qty = item.details.unit_value;
                }
                var other = _.find(this.itemsList, {'item': item});
                if (other) {
                    other.qty += qty/item.details.unit_value;
                    other.nb = nb++;
                } else {
                    this.itemsList.push({
                        item: item,
                        qty: qty/item.details.unit_value,
                        old_qty: qty/item.details.unit_value,
                        unit_value: item.details.unit_value,
                        old_unit_value: item.details.unit_value,
                        price: item.buy_price * qty * item.details.unit_value,
                        nb: nb++});
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
    var nb = 0;
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
                other.nb = nb++;
            } else {
                this.itemsList.push({ item: item, qty: qty/item.unit_value, unit_value: item.details.unit_value, nb: nb++ });
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
