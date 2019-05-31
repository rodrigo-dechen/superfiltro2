;(function ($){

    Array.prototype.cursorPosition = 0;
    Array.prototype.current = function(){
        return this[this.cursorPosition];
    };
    Array.prototype.next = function(){
        this.cursorPosition = Math.min(this.cursorPosition + 1, this.length);
        return this[this.cursorPosition];
    };
    Array.prototype.previous = function(){
        this.cursorPosition = Math.max(this.cursorPosition - 1, -1);
        return this[this.cursorPosition];
    };
    Array.prototype.isEnd = function(){
        return (this.cursorPosition >= this.length);
    };
    Array.prototype.intersect = function(filter){
        if (!Array.isArray(filter)) return this;
        return this.filter(function(n){
            return (filter.indexOf(n) !== -1);
        });
    };

    function getDataInContext ($context){
        const value = [];
        let $inputs = $($context.find([
            ':input[data-sf-input]:not(:radio):not(:checkbox):not(button)',
            ':input[data-sf-input]:radio:checked:not(:disabled)',
            ':input[data-sf-input]:checkbox:checked:not(:disabled)'
        ].join(', ')));
        $inputs.each(function(){
            let $e = $(this);
            value.push({
                name: (($e.attr('data-sf-name')) ? $e.attr('data-sf-name') : $e.attr('name')),
                value: $e.val(),
                disabled: $e.is(':disabled'),
                visible: $e.is(':visible')
            })
        });
        return value;
    }

    function QueryGrupe(query, checkClosing){
        let actions = [];
        let statusPrev = 'denial';
        let statusNext;
        let corrent;

        while (!query.isEnd()){
            corrent = query.current();
            query.next();

            statusNext = defineStaus(corrent);
            if(statusNext === false)
                throw new Error('step not available for query (' + corrent + ')');

            if(([
                'denial>groupClouse',
                'denial>logicalOperator',

                'comparison>denial',
                'comparison>comparison',
                'comparison>groupOpen',

                'groupOpen>groupClouse',
                'groupOpen>logicalOperator',

                'groupClouse>denial',
                'groupClouse>comparison',
                'groupClouse>groupOpen',

                'logicalOperator>groupClouse',
                'logicalOperator>logicalOperator'
            ].indexOf(statusPrev + ">" + statusNext) + 1))
                throw new Error('you can not use (' + statusNext + ') after (' + statusPrev + ')');

            statusPrev = statusNext;

            if(corrent === ')') break;

            else if(corrent === '('){
                const newGrupe = new QueryGrupe(query, true);
                actions.push(newGrupe);

            }else{
                actions.push(corrent);}
        }

        if(([
            'denial',
            'groupOpen',
            'logicalOperator'
        ].indexOf(statusNext) + 1))
            throw new Error('you can not end a query using (' + statusPrev + ')');

        if(checkClosing && corrent !== ')')
            throw new Error('some group is not properly closed');

        this.process = function(data){
            let result = false;
            let revert = false;
            let oprXOR = false;

            for(let i = 0; i < actions.length; i++){
                const resultPrev = result;
                const item = actions[i];

                if(item instanceof QueryGrupe) {
                    result = item.process(data);

                    if(revert){
                        revert = false;
                        result = !result;
                    }

                    if(oprXOR){
                        if(resultPrev === result){
                            result = false; break;
                        }else
                            result = true;
                    }
                }else if(Array.isArray(item) && item.length == 3){

                    const chaveNoData = item[0];
                    const conparandoValue = getValeu(chaveNoData, data);
                    const operator = item[1].toUpperCase();
                    const comparacaoValue = item[2];

                    switch (operator){
                        case 'IN': case 'NOT_IN':
                            const conparandoArray = ((Array.isArray(conparandoValue))? conparandoValue: [conparandoValue]);
                            const comparacaoArray = ((Array.isArray(comparacaoValue))? comparacaoValue: [comparacaoValue]);
                            const intersectArray = conparandoArray.intersect(comparacaoArray);
                            
                            if(operator == 'IN')
                                result = (intersectArray.length == conparandoArray.length);
                            else
                                result = (intersectArray.length != conparandoArray.length);

                            break;
                        case '=': case '==':
                            result = (conparandoValue == comparacaoValue);
                            break;
                        case '===': case 'IS':
                            result = (conparandoValue === comparacaoValue);
                            break;
                        case '!=':
                            result = (conparandoValue != comparacaoValue);
                            break;
                        case '!==': case 'NOT_IS':
                            result = (conparandoValue !== comparacaoValue);
                            break;
                        case '>=':
                            result = (conparandoValue >= comparacaoValue);
                            break;
                        case '<=':
                            result = (conparandoValue <= comparacaoValue);
                            break;
                        case '>':
                            result = (conparandoValue > comparacaoValue);
                            break;
                        case '<':
                            result = (conparandoValue < comparacaoValue);
                            break;
                        case ':':
                            result = resolveProp(chaveNoData, comparacaoValue, data);
                            break;
                        case '!:':
                            result = !resolveProp(chaveNoData, comparacaoValue, data);
                            break;
                        default: throw new Error('operator ("' + operator + '") is not an accepted comparator');
                    }
                    if(revert){
                        revert = false;
                        result = !result;
                    }

                    if(oprXOR){
                        if(resultPrev === result){
                            result = false; break;
                        }else
                            result = true;
                    }
                }

                else if(!result && typeof item == 'string' && (item.toUpperCase() == 'AND' || item.toUpperCase() == '&&')) break;

                else if(result && typeof item == 'string' && (item.toUpperCase() == 'OR' || item.toUpperCase() == '||')) break;

                else if(result && typeof item == 'string' && item.toUpperCase() == 'XOR') oprXOR = true;

                else if(typeof item == 'string' && (item.toUpperCase() == '!')) revert = true;
            }

            return result;
        };

        return this;

        function getValeu(key, data){
            for(const i in data) if(data.hasOwnProperty(i) && data[i].name == key) return data[i].value;
        }

        function defineStaus(corrent){
            if(Array.isArray(corrent)) return 'comparison';
            if(corrent == '(') return 'groupOpen';
            if(corrent == ')') return 'groupClouse';
            if(corrent == '!') return 'denial';
            if(([
                "AND", "OR", "XOR", "&&", "||"
            ].indexOf(corrent) + 1)) return 'logicalOperator';
            return false;
        }

        function resolveProp(key, value, data){
            const props = getProps(key, data);
            if (value == 'disabled') return props.disabled;
            if (value == 'visible') return props.visible;
            if (value == 'enabled') return !props.disabled;
            if (value == 'hidden') return !props.visible;
            throw new Error('property ("' + value + '") is not accepted as a result');
        }

        function getProps(key, data){
            for(const i in data) if(data.hasOwnProperty(i) && data[i].name == key) return {
                disabled: ((data[i].hasOwnProperty('disabled'))? data[i].disabled: false),
                visible: ((data[i].hasOwnProperty('visible'))? data[i].visible: true)
            };
        }
    }

    function resolveQuery(jsonQuery, data, debug){
        if (!jsonQuery) return;
        const query = JSON.parse(jsonQuery);
        if (debug) console.log(query);

        const objQuery = new QueryGrupe(query);

        if (debug) console.log(objQuery);

        return objQuery.process(data);
    }

    $.superFiltro2 = function($context, data){
        const o = {
            'debug': false,

            'class-visible': 'sf-visible',
            'class-hidden': 'sf-hidden',
            'trigger-visible': 'sf-visible',
            'trigger-hidden': 'sf-hidden',

            'class-disabled': 'sf-disabled',
            'class-enabled': 'sf-enabled',
            'trigger-disabled': 'sf-disabled',
            'trigger-enabled': 'sf-enabled'
        };

        if (o['debug']) console.group('Filter start');
        if (o['debug']) console.log('context', $context);

        if (typeof data === 'undefined') data = getDataInContext($context);
        if (o['debug']) console.table(data);

        let affecteds = $context.find('[data-sf-disabled]');
        if (affecteds.length) {
            if (o['debug']) console.group('sf-disabled');
            if (o['debug']) console.log(affecteds);
            affecteds.each(function (i, e) {
                if (o['debug']) console.groupCollapsed('Item: ' + i);
                const jsonQuery = $(e).attr('data-sf-disabled');
                const result = resolveQuery(jsonQuery, data, o['debug']);
                if (o['debug']) console.log('result: ', result);
                if(result) {
                    $(e).prop('disabled', true).removeClass(o['class-enabled']).addClass(o['class-disabled']).trigger(o['trigger-disabled']);
                    if (o['debug']) console.log('Item: ' + i + ' | disabled');
                }else{
                    $(e).prop('disabled', false).removeClass(o['class-disabled']).addClass(o['class-enabled']).trigger(o['trigger-enabled']);
                    if (o['debug']) console.log('Item: ' + i + ' | enabled');
                }
                if (o['debug']) console.groupEnd();
            });
            if (o['debug']) console.groupEnd();
        }

        affecteds = $context.find('[data-sf-enabled]');
        if (affecteds.length) {
            if (o['debug']) console.group('sf-enabled');
            if (o['debug']) console.log(affecteds);
            affecteds.each(function (i, e) {
                if (o['debug']) console.groupCollapsed('Item: ' + i);
                const jsonQuery = $(e).attr('data-sf-enabled');
                const result = resolveQuery(jsonQuery, data, o['debug']);
                if (o['debug']) console.log('result: ', result);
                if(result) {
                    $(e).prop('disabled', false).removeClass(o['class-disabled']).addClass(o['class-enabled']).trigger(o['trigger-enabled']);
                    if (o['debug']) console.log('Item: ' + i + ' | enabled');
                }else{
                    $(e).prop('disabled', true).removeClass(o['class-enabled']).addClass(o['class-disabled']).trigger(o['trigger-disabled']);
                    if (o['debug']) console.log('Item: ' + i + ' | disabled');
                }
                if (o['debug']) console.groupEnd();
            });
            if (o['debug']) console.groupEnd();
        }

        affecteds = $context.find('[data-sf-hide]');
        if (affecteds.length) {
            if (o['debug']) console.group('sf-hide');
            if (o['debug']) console.log(affecteds);
            affecteds.each(function (i, e) {
                if (o['debug']) console.groupCollapsed('Item: ' + i);
                const jsonQuery = $(e).attr('data-sf-hide');
                const result = resolveQuery(jsonQuery, data, o['debug']);
                if (o['debug']) console.log('result: ', result);
                if(result) {
                    $(e).removeClass(o['class-visible']).addClass(o['class-hidden']).trigger(o['trigger-hidden']);
                    if (o['debug']) console.log('Item: ' + i + ' | hidden');
                }else{
                    $(e).removeClass(o['class-hidden']).addClass(o['class-visible']).trigger(o['trigger-visible']);
                    if (o['debug']) console.log('Item: ' + i + ' | visible');
                }
                if (o['debug']) console.groupEnd();
            });
            if (o['debug']) console.groupEnd();
        }

        affecteds = $context.find('[data-sf-show]');
        if (affecteds.length) {
            if (o['debug']) console.group('sf-show');
            if (o['debug']) console.log(affecteds);
            affecteds.each(function (i, e) {
                if (o['debug']) console.groupCollapsed('Item: ' + i);
                const jsonQuery = $(e).attr('data-sf-show');
                const result = resolveQuery(jsonQuery, data, o['debug']);
                if (o['debug']) console.log('result: ', result);
                if(result) {
                    $(e).removeClass(o['class-hidden']).addClass(o['class-visible']).trigger(o['trigger-visible']);
                    if (o['debug']) console.log('Item: ' + i + ' | visible');
                }else{
                    $(e).removeClass(o['class-visible']).addClass(o['class-hidden']).trigger(o['trigger-hidden']);
                    if (o['debug']) console.log('Item: ' + i + ' | hidden');
                }
                if (o['debug']) console.groupEnd();
            });
            if (o['debug']) console.groupEnd();
        }

        if (o['debug']) console.groupEnd();
    };

    $.fn.superFiltro2 = function(data){
        $.superFiltro2(this, data);
        return this;
    };

    $(function(){ $('body')
        .on('click',  '[data-sf="click"]',  dispararProcesso)
        .on('change', '[data-sf="change"]', dispararProcesso);
    });

    function dispararProcesso(){
        const $this = $(this);
        const $context =
            (($this.attr('data-sf-parent')) ? $($this.parents($this.attr('data-sf-parent'))[0]) :
            (($this.attr('data-sf-context')) ? $($this.attr('data-sf-context')[0]) :
            $('body')));
        $.superFiltro2($context);
    }

})(jQuery);