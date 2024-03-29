import {Component, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';

import {Store} from '@ngrx/store';

import {AuthService} from '../auth.service';
import {Router} from '@angular/router';
import {AppState} from '../../reducers';
import {MessageService} from 'primeng/api';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

    loginform: UntypedFormGroup;
    languages = [
        {label: 'Nederlands', value: 'NL'},
        {label: 'Français', value: 'FR'},
        {label: 'English', value: 'EN'}
    ];

  constructor(
      private fb: UntypedFormBuilder,
      private auth: AuthService,
      private router: Router,
      private store: Store<AppState>,
      private messageService: MessageService) {

      this.loginform = fb.group({
          idUser: ['', [Validators.required]],
          password: ['', [Validators.required, Validators.minLength(6)]],
          language: ['', [Validators.required]],
      });

  }

  ngOnInit() {

  }

  login() {
      const val = this.loginform.value;
      console.log('Selected language: ', val.language);

      this.auth.login();
  }

}

