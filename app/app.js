'use strict';

angular.module('barsApp', [
  'ui.router',
  'ui.bootstrap',
  'infinite-scroll',
  'angularMoment',
  'ngAnimate',
  'ngSanitize',

  'bars.auth',
  'bars.main',
  'bars.bars',
  'bars.admin',
  'bars.magicbar',
  'bars.meal',
  'bars.settings',

  'APIModel',
  'bars.api.bar',
  'bars.api.food',
  'bars.api.user',
  'bars.api.account',
  'bars.api.transaction',
  'bars.api.news',
  'bars.api.role'
])

.config(['APIURLProvider', function(APIURL) {
    // APIURL.url = "http://bars.nadrieril.fr/api";
    APIURL.url = "http://129.104.201.62:8010/api";
    // APIURL.url = "http://127.0.0.1:8000";
}])

.config(['$httpProvider',
    function ($httpProvider) {
        $httpProvider.interceptors.push('auth.interceptor');
}])

.run(['amMoment', 'auth.user', '$rootScope',
    function(amMoment, AuthUser, $rootScope) {
        moment.locale('fr', {
            calendar : {
                lastDay : '[Hier]',
                sameDay : "[Aujourd'hui]",
                nextDay : '[Demain]',
                lastWeek : 'dddd [dernier]',
                nextWeek : 'dddd [prochain]',
                sameElse : 'L'
            }
        });
        amMoment.changeLocale('fr');

        $(document).keyup(function(e) {
            if (e.keyCode == 27) {
                AuthUser.logout();
                $rootScope.$apply();
            }
        });
}])
;
