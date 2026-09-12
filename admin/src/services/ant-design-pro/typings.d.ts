// @ts-ignore
/* eslint-disable */

declare namespace API {
  type CurrentUser = {
    name?: string;
    avatar?: string;
    userid?: string;
    email?: string;
    access?: string; // 'admin' | 'operator' | 'viewer'
  };

  type LoginResult = {
    status?: string;
    type?: string;
    currentAuthority?: string;
    token?: string;
  };

  type LoginParams = {
    username?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
  };

  type FakeCaptcha = {
    code?: number;
    status?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };
}
