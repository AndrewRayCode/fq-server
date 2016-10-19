import passport from 'passport';
import db from '../../src/db';

export function load( req ) {

    return db( 'site_data' )
        .select()
        .then( rows => {
            return { defaultUserRoleId: rows[ 0 ].default_user_role_id };
        })
        .then( continuation => {
            return db( 'roles' )
                .then( rows => {
                    return {
                        ...continuation,
                        roles: rows.reduce( ( memo, row ) => ({
                            ...memo,
                            [ row.id ]: row.name,
                        }), {} )
                    };
                });
        });

}
