import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { WelcomeComponent } from '../../view/welcome/welcome.component';
import { SignInComponent } from '../../view/sign-in/sign-in.component';
import { SignUpComponent } from '../../view/sign-up/sign-up.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'welcome',
        component: WelcomeComponent,
        title: 'Welcome'
      },
      {
        path: 'sign-in',
        component: SignInComponent,
        title: 'Sign In'
      },
      {
        path: 'sign-up',
        component: SignUpComponent,
        title: 'Sign Up'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
